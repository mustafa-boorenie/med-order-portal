import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-string' })
  id: string;

  @ApiProperty({ description: 'Product name', example: 'Insulin Pen (Humalog)' })
  name: string;

  @ApiProperty({ description: 'Product SKU', example: 'INS-HUM-001' })
  sku: string;

  @ApiProperty({ description: 'Price in cents', example: 12500 })
  priceCents: number;

  @ApiProperty({ description: 'Quantity in stock', example: 25 })
  quantity: number;

  @ApiProperty({
    description: 'Expiration date',
    example: '2024-12-31T00:00:00Z',
    nullable: true,
  })
  expirationDate: string | null;

  @ApiProperty({ description: 'Par level for inventory alerts', example: 10 })
  parLevel: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}