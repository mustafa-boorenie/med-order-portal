import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOrdersAnalytics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        totalCents: true,
        status: true,
      },
    });

    // Group by date
    const ordersByDate = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, revenue: 0 };
      }
      acc[date].orders += 1;
      if (order.status === 'PAID' || order.status === 'FULFILLED') {
        acc[date].revenue += order.totalCents;
      }
      return acc;
    }, {});

    // Convert to array format
    const ordersPerDay = Object.entries(ordersByDate).map(([date, data]) => ({
      date,
      orders: (data as any).orders,
      revenue: (data as any).revenue,
    }));

    return ordersPerDay.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getInventoryAnalytics() {
    const lowStockItems = await this.prisma.product.findMany({
      where: {
        quantity: {
          lt: this.prisma.product.fields.parLevel,
        },
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        parLevel: true,
      },
      orderBy: {
        quantity: 'asc',
      },
    });

    return { lowStockItems };
  }

  async getRevenueAnalytics() {
    const totalRevenue = await this.prisma.order.aggregate({
      where: {
        status: {
          in: ['PAID', 'FULFILLED'],
        },
      },
      _sum: {
        totalCents: true,
      },
    });

    const totalOrders = await this.prisma.order.count({
      where: {
        status: {
          in: ['PAID', 'FULFILLED'],
        },
      },
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await this.prisma.order.aggregate({
      where: {
        status: {
          in: ['PAID', 'FULFILLED'],
        },
        createdAt: {
          gte: thisMonth,
        },
      },
      _sum: {
        totalCents: true,
      },
    });

    const monthlyOrders = await this.prisma.order.count({
      where: {
        status: {
          in: ['PAID', 'FULFILLED'],
        },
        createdAt: {
          gte: thisMonth,
        },
      },
    });

    return {
      totalRevenue: totalRevenue._sum.totalCents || 0,
      totalOrders,
      monthlyRevenue: monthlyRevenue._sum.totalCents || 0,
      monthlyOrders,
    };
  }

  async getPaymentAnalytics() {
    // Get all payments data
    const totalPayments = await this.prisma.payment.count();
    
    const totalRevenue = await this.prisma.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
      },
      _sum: {
        amountCents: true,
      },
    });

    const averageOrderValue = await this.prisma.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
      },
      _avg: {
        amountCents: true,
      },
    });

    // Today's payments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentsToday = await this.prisma.payment.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const revenueTodayData = await this.prisma.payment.aggregate({
      where: {
        status: 'SUCCEEDED',
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amountCents: true,
      },
    });

    // Success rate calculation
    const successfulPayments = await this.prisma.payment.count({
      where: {
        status: 'SUCCEEDED',
      },
    });

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

    // Recent payments
    const recentPayments = await this.prisma.payment.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        order: {
          select: {
            patientName: true,
          },
        },
      },
    });

    return {
      totalPayments,
      totalRevenueCents: totalRevenue._sum.amountCents || 0,
      averageOrderValueCents: Math.round(averageOrderValue._avg.amountCents || 0),
      paymentsToday,
      revenueTodayCents: revenueTodayData._sum.amountCents || 0,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amountCents,
        status: payment.status,
        patientName: payment.order.patientName,
        createdAt: payment.createdAt.toISOString(),
      })),
    };
  }
}