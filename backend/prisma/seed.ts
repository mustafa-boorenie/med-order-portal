import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@medportal.com' },
    update: {},
    create: {
      email: 'admin@medportal.com',
      role: Role.ADMIN,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@medportal.com' },
    update: {},
    create: {
      email: 'doctor@medportal.com',
      role: Role.DOCTOR,
    },
  });

  console.log(`👤 Created users: Admin (${adminUser.id}), Doctor (${doctorUser.id})`);

  // Create products
  const products = [
    {
      name: 'Insulin Pen (Humalog)',
      sku: 'INS-HUM-001',
      priceCents: 12500, // $125.00
      quantity: 25,
      expirationDate: new Date('2024-12-31'),
      parLevel: 10,
    },
    {
      name: 'Blood Pressure Monitor',
      sku: 'BPM-DIG-001',
      priceCents: 7999, // $79.99
      quantity: 15,
      expirationDate: null,
      parLevel: 5,
    },
    {
      name: 'Glucose Test Strips (50 count)',
      sku: 'GTS-50-001',
      priceCents: 2499, // $24.99
      quantity: 40,
      expirationDate: new Date('2025-06-30'),
      parLevel: 20,
    },
    {
      name: 'Digital Thermometer',
      sku: 'THM-DIG-001',
      priceCents: 1999, // $19.99
      quantity: 30,
      expirationDate: null,
      parLevel: 15,
    },
    {
      name: 'Metformin 500mg (30 tablets)',
      sku: 'MET-500-30',
      priceCents: 1200, // $12.00
      quantity: 50,
      expirationDate: new Date('2025-03-15'),
      parLevel: 25,
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });
  }

  console.log(`📦 Created ${products.length} products`);

  // Create sample orders
  const createdProducts = await prisma.product.findMany();
  
  const sampleOrder = await prisma.order.create({
    data: {
      patientName: 'John Doe',
      patientEmail: 'john.doe@example.com',
      doctorId: doctorUser.id,
      totalCents: 32498, // Total of first 3 products
      status: 'PENDING',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            quantity: 1,
          },
          {
            productId: createdProducts[1].id,
            quantity: 1,
          },
          {
            productId: createdProducts[2].id,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log(`📝 Created sample order: ${sampleOrder.id}`);

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });