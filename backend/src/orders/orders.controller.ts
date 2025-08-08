import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto, OrderResponseDto } from './dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  async create(@Body() createOrderDto: CreateOrderDto) {
    console.log('📝 Received order creation request:', createOrderDto);
    try {
      const result = await this.ordersService.create(createOrderDto);
      console.log('✅ Order created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw error;
    }
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'List of all orders',
    type: [OrderResponseDto],
  })
  async findAll(
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.ordersService.findAll({ status, doctorId });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }

  @Post(':id/link')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate checkout link for order' })
  @ApiResponse({
    status: 200,
    description: 'Checkout link generated',
    schema: {
      properties: {
        checkoutUrl: { type: 'string' },
        token: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
  })
  async generateCheckoutLink(@Param('id') id: string) {
    return this.ordersService.generateCheckoutLink(id);
  }

  @Post(':id/send-payment-link')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send payment link via email or SMS' })
  @ApiResponse({
    status: 200,
    description: 'Payment link sent successfully',
  })
  async sendPaymentLink(
    @Param('id') id: string,
    @Body() body: { method: 'email' | 'sms' | 'text'; phone?: string },
  ) {
    return this.ordersService.sendPaymentLink(id, body.method, body.phone);
  }
}