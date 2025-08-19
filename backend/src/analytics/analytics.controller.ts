import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Auth0Guard } from '../auth/guards/auth0.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(Auth0Guard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Get orders analytics' })
  @ApiResponse({ status: 200, description: 'Orders analytics data' })
  async getOrdersAnalytics(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getOrdersAnalytics(daysNumber);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory analytics' })
  @ApiResponse({ status: 200, description: 'Inventory analytics data' })
  async getInventoryAnalytics() {
    return this.analyticsService.getInventoryAnalytics();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics data' })
  async getRevenueAnalytics() {
    return this.analyticsService.getRevenueAnalytics();
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payment analytics' })
  @ApiResponse({ status: 200, description: 'Payment analytics data' })
  async getPaymentAnalytics() {
    return this.analyticsService.getPaymentAnalytics();
  }

  @Get('patients-count')
  @ApiOperation({ summary: 'Get total patients count' })
  @ApiResponse({ status: 200, description: 'Total number of patients' })
  async getPatientsCount() {
    return this.analyticsService.getPatientsCount();
  }
}