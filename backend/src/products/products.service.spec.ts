import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      fields: {
        parLevel: 'parLevel',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all products including out of stock', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', quantity: 10 },
        { id: '2', name: 'Product 2', quantity: 0 },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll(true);

      expect(result).toEqual(mockProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { name: 'asc' },
      });
    });

    it('should return only in-stock products when includeOutOfStock is false', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', quantity: 10 },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll(false);

      expect(result).toEqual(mockProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { quantity: { gt: 0 } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = { id: '1', name: 'Product 1', quantity: 10 };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('1');

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto = {
        name: 'New Product',
        sku: 'NEW-001',
        priceCents: 1000,
        quantity: 50,
        parLevel: 10,
      };
      const mockCreatedProduct = { id: '1', ...createProductDto };

      mockPrismaService.product.create.mockResolvedValue(mockCreatedProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockCreatedProduct);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: createProductDto,
      });
    });
  });

  describe('checkStock', () => {
    it('should return true when sufficient stock is available', async () => {
      const mockProduct = { id: '1', name: 'Product 1', quantity: 10 };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.checkStock('1', 5);

      expect(result).toBe(true);
    });

    it('should return false when insufficient stock is available', async () => {
      const mockProduct = { id: '1', name: 'Product 1', quantity: 3 };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.checkStock('1', 5);

      expect(result).toBe(false);
    });
  });
});