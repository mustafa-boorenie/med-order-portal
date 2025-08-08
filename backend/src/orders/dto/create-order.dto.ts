import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-string' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to order', example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ 
    description: 'Order type', 
    example: 'patient',
    enum: ['patient', 'stock'],
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['patient', 'stock'])
  orderType?: string;

  @ApiProperty({ description: 'Patient ID (if existing)', example: 'uuid-string', required: false })
  @IsOptional()
  patientId?: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  patientName: string;

  @ApiProperty({ description: 'Patient email', example: 'john.doe@example.com' })
  @IsEmail()
  patientEmail: string;

  @ApiProperty({ description: 'Patient phone', example: '+18325551234', required: false })
  @IsOptional()
  @IsString()
  patientPhone?: string;

  @ApiProperty({
    description: 'Doctor ID (optional)',
    example: 'uuid-string',
    required: false,
  })
  @IsOptional()
  doctorId?: string;

  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}