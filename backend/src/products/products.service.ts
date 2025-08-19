import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeOutOfStock = true) {
    const startTime = Date.now();
    
    const products = await this.prisma.product.findMany({
      where: includeOutOfStock ? undefined : { quantity: { gt: 0 } },
      orderBy: { name: 'asc' },
    });

    const responseTime = Date.now() - startTime;
    console.log(`📦 Products query completed in ${responseTime}ms`);

    return products;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        costCents: createProductDto.costCents ?? Math.max(0, Math.floor((createProductDto.priceCents || 0) * 0.6)),
      },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({
        where: { id },
      });
      return { message: 'Product deleted successfully' };
    } catch (error) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        quantity: {
          lt: this.prisma.product.fields.parLevel,
        },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async updateQuantity(id: string, quantity: number) {
    return this.prisma.product.update({
      where: { id },
      data: { quantity },
    });
  }

  async checkStock(productId: string, requestedQuantity: number): Promise<boolean> {
    const product = await this.findOne(productId);
    return product.quantity >= requestedQuantity;
  }
}