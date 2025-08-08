import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    if (!search || search.trim() === '') {
      return this.prisma.patient.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit to recent 20 patients
      });
    }

    // Smart search across name, email, and phone
    const searchTerm = search.toLowerCase();
    return this.prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}