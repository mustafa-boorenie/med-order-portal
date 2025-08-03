import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID' })
  id: string;

  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Quantity ordered' })
  quantity: number;

  @ApiProperty({ description: 'Product details', required: false })
  product?: {
    id: string;
    name: string;
    sku: string;
    priceCents: number;
  };
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Patient name' })
  patientName: string;

  @ApiProperty({ description: 'Patient email' })
  patientEmail: string;

  @ApiProperty({ description: 'Doctor ID', nullable: true })
  doctorId: string | null;

  @ApiProperty({ description: 'Total amount in cents' })
  totalCents: number;

  @ApiProperty({ description: 'Order status' })
  status: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;

  @ApiProperty({ description: 'Order items', type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ description: 'Doctor details', required: false })
  doctor?: {
    id: string;
    email: string;
    role: string;
  };
}