import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { FhirService } from './fhir.service';

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
  expirationDate: Date | null;
  parLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PharmacyService {
  constructor(
    private prisma: PrismaService,
    private fhirService: FhirService,
  ) {}

  async submitOrderToPharmacy(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    try {
      // Generate FHIR MedicationRequest
      const medicationRequest = this.fhirService.createMedicationRequest(order);

      // Log the request
      await this.prisma.pharmacyLog.create({
        data: {
          orderId,
          requestPayload: medicationRequest,
          status: 'SENT',
        },
      });

      console.log(`📋 FHIR MedicationRequest created for order ${orderId}`);
      
      // In a real implementation, this would send to the pharmacy API
      // For now, we'll simulate a successful response
      const simulatedResponse = {
        status: 'accepted',
        pharmacyOrderId: `PH-${Date.now()}`,
        estimatedFulfillment: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      await this.prisma.pharmacyLog.update({
        where: { orderId },
        data: {
          responsePayload: simulatedResponse,
          status: 'SUCCESS',
        },
      });

      return simulatedResponse;
    } catch (error) {
      await this.prisma.pharmacyLog.upsert({
        where: { orderId },
        create: {
          orderId,
          requestPayload: { error: 'Failed to create request' },
          status: 'ERROR',
        },
        update: {
          status: 'ERROR',
          responsePayload: { error: error.message },
        },
      });
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStockAndAlert() {
    console.log('🔍 Checking for low stock items...');
    
    // Use raw SQL to compare quantity with parLevel
    const lowStockItems = await this.prisma.$queryRaw<ProductRow[]>`
      SELECT * FROM products 
      WHERE quantity < "parLevel"
    `;

    if (lowStockItems.length > 0) {
      console.log(`⚠️  Found ${lowStockItems.length} low stock items:`, 
        lowStockItems.map(item => `${item.name} (${item.quantity}/${item.parLevel})`));
      
      // In a real implementation, this would send email alerts
      // For now, we'll just log the alert
      await this.sendLowStockAlert(lowStockItems);
    } else {
      console.log('✅ All items are adequately stocked');
    }
  }

  private async sendLowStockAlert(items: ProductRow[]) {
    // Mock email service
    console.log('📧 Sending low stock alert email...');
    console.log('Recipients: admin@medportal.com, inventory@medportal.com');
    console.log('Subject: Low Stock Alert - Medical Order Portal');
    console.log('Items needing restock:', items.map(item => 
      `- ${item.name}: ${item.quantity} remaining (par level: ${item.parLevel})`
    ).join('\n'));
  }
}