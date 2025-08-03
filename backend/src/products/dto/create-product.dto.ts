import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Insulin Pen (Humalog)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Product SKU', example: 'INS-HUM-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Price in cents', example: 12500 })
  @IsNumber()
  @IsPositive()
  priceCents: number;

  @ApiProperty({ description: 'Quantity in stock', example: 25, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Expiration date',
    example: '2024-12-31T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({
    description: 'Par level for inventory alerts',
    example: 10,
    default: 10,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  parLevel?: number;
}