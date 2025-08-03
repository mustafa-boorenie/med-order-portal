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
}