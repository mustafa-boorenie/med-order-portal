import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { items, orderType = 'patient', patientPhone, ...orderData } = createOrderDto;

    // Handle patient creation or lookup
    let patientId = orderData.patientId;
    
    if (orderType === 'patient') {
      // Check if patient exists by email
      let patient = await this.prisma.patient.findUnique({
        where: { email: orderData.patientEmail },
      });

      if (!patient) {
        // Create new patient
        patient = await this.prisma.patient.create({
          data: {
            name: orderData.patientName,
            email: orderData.patientEmail,
            phone: patientPhone || null,
          },
        });
        console.log(`✅ Created new patient: ${patient.id}`);
      } else if (patientPhone && patient.phone !== patientPhone) {
        // Update phone number if provided and different
        patient = await this.prisma.patient.update({
          where: { id: patient.id },
          data: { phone: patientPhone },
        });
        console.log(`📱 Updated patient phone number`);
      }
      
      patientId = patient.id;
    }

    // Validate and calculate total
    let totalCents = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await this.productsService.findOne(item.productId);
      
      // For patient orders, check stock availability. For stock orders, skip this check
      if (orderType === 'patient' && product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }

      validatedItems.push(item);
      totalCents += product.priceCents * item.quantity;
    }

    // Ensure doctor exists if doctorId provided
    if (orderData.doctorId) {
      const existingDoctor = await this.prisma.user.findUnique({ where: { id: orderData.doctorId } });
      if (!existingDoctor) {
        await this.prisma.user.create({
          data: {
            id: orderData.doctorId,
            email: orderData.patientEmail, // fallback email, can be updated later
            role: 'DOCTOR',
          },
        });
      }
    }

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        patientId,
        totalCents,
        status: orderType === 'stock' ? 'FULFILLED' : 'PENDING', // Stock orders are auto-fulfilled
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        doctor: true,
        patient: true,
      },
    });

    // Update product quantities
    for (const item of validatedItems) {
      const product = await this.productsService.findOne(item.productId);
      
      if (orderType === 'stock') {
        // For stock orders, ADD to inventory
        await this.productsService.updateQuantity(
          item.productId,
          product.quantity + item.quantity,
        );
      } else {
        // For patient orders, SUBTRACT from inventory
        await this.productsService.updateQuantity(
          item.productId,
          product.quantity - item.quantity,
        );
      }
    }

    return order;
  }

  async findAll(filters: { status?: string; doctorId?: string }) {
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.doctorId) {
      where.doctorId = filters.doctorId;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        doctor: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        doctor: true,
        patient: true,
        payments: true,
        pharmacyLog: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    try {
      return await this.prisma.order.update({
        where: { id },
        data: {
          patientName: updateOrderDto.patientName,
          patientEmail: updateOrderDto.patientEmail,
          doctorId: updateOrderDto.doctorId,
          status: updateOrderDto.status,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          doctor: true,
        },
      });
    } catch (error) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }
    
    if (order.status === 'FULFILLED') {
      throw new BadRequestException('Cannot cancel fulfilled order');
    }

    // Restore inventory if order was paid but not fulfilled
    if (order.status === 'PAID') {
      for (const item of order.items) {
        const product = await this.productsService.findOne(item.productId);
        await this.productsService.updateQuantity(
          item.productId,
          product.quantity + item.quantity,
        );
      }
    }

    await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Order cancelled successfully' };
  }

  async generateCheckoutLink(id: string) {
    const order = await this.findOne(id);
    
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in pending status');
    }

    // Generate JWT token for checkout
    const payload = {
      orderId: id,
      type: 'checkout',
      iat: Math.floor(Date.now() / 1000),
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '24h',
      secret: process.env.JWT_SECRET,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const checkoutUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout?token=${token}`;

    return {
      checkoutUrl,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async markAsPaid(id: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  async markAsFulfilled(id: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: 'FULFILLED' },
    });
  }

  async sendPaymentLink(id: string, method: 'email' | 'sms' | 'text', phone?: string) {
    const order = await this.findOne(id);
    
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Can only send payment links for pending orders');
    }

    // Normalize method name
    const normalizedMethod = method === 'text' ? 'sms' : method;

    // Use phone from patient record if available and not provided
    const phoneToUse = phone || (order.patient?.phone || null);

    if ((normalizedMethod === 'sms') && !phoneToUse) {
      throw new BadRequestException('Phone number is required for SMS delivery. Patient has no phone on file.');
    }

    // Generate checkout link
    const linkData = await this.generateCheckoutLink(id);

    // Send notification with normalized method
    console.log(`📤 Sending payment link via ${normalizedMethod} to ${normalizedMethod === 'sms' ? phoneToUse : order.patientEmail}`);
    
    await this.notificationsService.sendPaymentLink({
      orderId: id,
      checkoutUrl: linkData.checkoutUrl,
      patientName: order.patientName,
      patientEmail: order.patientEmail,
      patientPhone: phoneToUse,
      totalCents: order.totalCents,
      method: normalizedMethod as 'email' | 'sms',
    });

    return { 
      message: `Payment link sent via ${method}`,
      checkoutUrl: linkData.checkoutUrl,
    };
  }
}