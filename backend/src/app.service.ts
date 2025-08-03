import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { message: string; timestamp: string; version: string } {
    return {
      message: 'Medical Order Portal API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  getDetailedHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'connected', // This would be checked in real implementation
        stripe: 'configured',
        email: 'configured',
      },
    };
  }
}