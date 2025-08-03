import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private productsService: ProductsService,
    private jwtService: JwtService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    // Validate stock and calculate total
    let totalCents = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await this.productsService.findOne(item.productId);
      
      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
      }

      validatedItems.push(item);
      totalCents += product.priceCents * item.quantity;
    }

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        totalCents,
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
      },
    });

    // Update product quantities
    for (const item of validatedItems) {
      const product = await this.productsService.findOne(item.productId);
      await this.productsService.updateQuantity(
        item.productId,
        product.quantity - item.quantity,
      );
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
}