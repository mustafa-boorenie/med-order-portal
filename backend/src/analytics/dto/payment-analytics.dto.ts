import { ApiProperty } from '@nestjs/swagger';

export class PaymentAnalyticsDto {
  @ApiProperty({ description: 'Total number of payments' })
  totalPayments: number;

  @ApiProperty({ description: 'Total revenue in cents' })
  totalRevenueCents: number;

  @ApiProperty({ description: 'Average order value in cents' })
  averageOrderValueCents: number;

  @ApiProperty({ description: 'Number of successful payments today' })
  paymentsToday: number;

  @ApiProperty({ description: 'Revenue today in cents' })
  revenueTodayCents: number;

  @ApiProperty({ description: 'Payment success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Most recent payments', type: 'array' })
  recentPayments: Array<{
    id: string;
    orderId: string;
    amount: number;
    status: string;
    patientName: string;
    createdAt: string;
  }>;
}

export class PaymentEventDto {
  @ApiProperty({ description: 'Event type' })
  eventType: 'payment_succeeded' | 'payment_failed' | 'payment_cancelled';

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiProperty({ description: 'Payment amount in cents' })
  amountCents: number;

  @ApiProperty({ description: 'Patient email' })
  patientEmail: string;

  @ApiProperty({ description: 'Timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Additional metadata', required: false })
  metadata?: Record<string, any>;
}