import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  RawBody,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto, PaymentResponseDto } from './dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @ApiOperation({ summary: 'Create Stripe PaymentIntent' })
  @ApiResponse({
    status: 201,
    description: 'PaymentIntent created successfully',
    schema: {
      properties: {
        clientSecret: { type: 'string' },
        paymentIntentId: { type: 'string' },
      },
    },
  })
  async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    const startTime = Date.now();
    const result = await this.paymentsService.createPaymentIntent(createPaymentIntentDto);
    const responseTime = Date.now() - startTime;
    
    console.log(`💳 Payment intent created in ${responseTime}ms`);
    return result;
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleStripeWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details',
    type: PaymentResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payments for an order' })
  @ApiResponse({
    status: 200,
    description: 'Order payments',
    type: [PaymentResponseDto],
  })
  async findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }
}