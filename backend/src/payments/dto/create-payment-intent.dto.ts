import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Order ID to create payment for', example: 'uuid-string' })
  @IsUUID()
  orderId: string;
}