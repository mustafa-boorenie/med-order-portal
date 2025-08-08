import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentIntentDto } from './dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.warn('⚠️  Stripe secret key not configured');
      return;
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(), // Use fetch for better performance
      maxNetworkRetries: 1, // Reduce retries for faster failures
      timeout: 10000, // 10 second timeout
    });
  }

  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const { orderId } = createPaymentIntentDto;
    
    // Use a more efficient query with only necessary fields
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalCents: true,
        patientEmail: true,
        patientName: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in pending status');
    }

    // Check if payment intent already exists for this order
    const existingPayment = await this.prisma.payment.findFirst({
      where: { orderId: order.id },
      select: {
        stripePaymentIntentId: true,
        status: true,
      },
    });

    if (existingPayment && existingPayment.status === 'PENDING') {
      // Retrieve existing payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        existingPayment.stripePaymentIntentId
      );
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }

    try {
      // Create new payment intent and payment record in parallel
      const [paymentIntent] = await Promise.all([
        // Create Stripe PaymentIntent
        this.stripe.paymentIntents.create({
          amount: order.totalCents,
          currency: 'usd',
          metadata: {
            orderId: order.id,
          },
          automatic_payment_methods: {
            enabled: true,
          },
          // Optimize for speed
          capture_method: 'automatic',
        }),
      ]);

      // Create payment record asynchronously (don't wait)
      this.prisma.payment.create({
        data: {
          orderId: order.id,
          stripePaymentIntentId: paymentIntent.id,
          amountCents: order.totalCents,
          status: 'PENDING',
        },
      }).catch(error => {
        console.error('Failed to create payment record:', error);
        // Don't throw - payment intent was created successfully
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Stripe PaymentIntent creation failed:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: { 
          order: {
            include: {
              items: {
                include: {
                  product: true
                }
              }
            }
          }
        },
      });

      if (!payment) {
        console.error(`❌ Payment not found for PaymentIntent: ${paymentIntent.id}`);
        return;
      }

      // Begin transaction to ensure data consistency
      await this.prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'SUCCEEDED',
            updatedAt: new Date()
          },
        });

        // Update order status to PAID
        await tx.order.update({
          where: { id: payment.orderId },
          data: { 
            status: 'PAID',
            updatedAt: new Date()
          }
        });

        console.log(`✅ Payment succeeded for order: ${payment.orderId}`);
        console.log(`💰 Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
        console.log(`👤 Customer: ${payment.order.patientName} (${payment.order.patientEmail})`);

        // Log successful payment for audit
        console.log(`📊 Payment audit: OrderID=${payment.orderId}, PaymentIntentID=${paymentIntent.id}, Amount=${paymentIntent.amount}, Status=SUCCEEDED`);
      });

      // Send confirmation email to patient
      try {
        await this.notificationsService.sendPaymentConfirmation({
          orderId: payment.orderId,
          patientName: payment.order.patientName,
          patientEmail: payment.order.patientEmail,
          totalCents: payment.order.totalCents,
          items: payment.order.items.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            priceCents: item.product.priceCents,
          })),
        });
      } catch (emailError) {
        console.error(`📧 Failed to send confirmation email for order ${payment.orderId}:`, emailError);
        // Don't throw - payment was successful even if email failed
      }

      // TODO: Notify pharmacy system if applicable
      
    } catch (error) {
      console.error(`💥 Error handling payment success for ${paymentIntent.id}:`, error);
      throw error;
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: { order: true }
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'FAILED',
            updatedAt: new Date()
          },
        });
        
        console.log(`❌ Payment failed for order: ${payment.orderId}`);
        console.log(`💸 Failed amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
        console.log(`📊 Payment audit: OrderID=${payment.orderId}, PaymentIntentID=${paymentIntent.id}, Status=FAILED`);
        
        // TODO: Send failure notification email
        // TODO: Restore inventory if needed
      }
    } catch (error) {
      console.error(`💥 Error handling payment failure for ${paymentIntent.id}:`, error);
    }
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: { order: true }
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'CANCELLED',
            updatedAt: new Date()
          },
        });
        
        console.log(`⚪ Payment canceled for order: ${payment.orderId}`);
        console.log(`📊 Payment audit: OrderID=${payment.orderId}, PaymentIntentID=${paymentIntent.id}, Status=CANCELLED`);
        
        // TODO: Restore inventory
        // TODO: Send cancellation notification
      }
    } catch (error) {
      console.error(`💥 Error handling payment cancellation for ${paymentIntent.id}:`, error);
    }
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}