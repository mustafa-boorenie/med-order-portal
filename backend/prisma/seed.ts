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

  const drMustafa = await prisma.user.upsert({
    where: { email: 'drmustafa@bdqholdings.com' },
    update: {},
    create: {
      email: 'drmustafa@bdqholdings.com',
      role: Role.ADMIN,
    },
  });

  const mustafaTest = await prisma.user.upsert({
    where: { email: 'mustafa@test.com' },
    update: { role: Role.ADMIN },
    create: {
      email: 'mustafa@test.com',
      role: Role.ADMIN,
    },
  });

  console.log(`👤 Created users: Admin (${adminUser.id}), Doctor (${doctorUser.id}), Mustafa (${mustafaTest.id})`);

  // Helper utilities
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T>(arr: T[]) => arr[rand(0, arr.length - 1)];

  // Doctors
  const extraDoctors: string[] = ['dr.adams@medportal.com', 'dr.lee@medportal.com', 'dr.khan@medportal.com'];
  const doctors = [doctorUser, adminUser];
  for (const email of extraDoctors) {
    const d = await prisma.user.upsert({ where: { email }, update: {}, create: { email, role: Role.DOCTOR } });
    doctors.push(d);
  }

  // Patients
  const patientNames = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Michael Davis', 'Emily Wilson', 'David Martinez', 'Sarah Taylor', 'Daniel Anderson', 'Laura Thomas'];
  const patients = [] as { id: string; name: string; email: string }[];
  for (let i = 0; i < 40; i++) {
    const name = `${pick(patientNames).split(' ')[0]} ${pick(patientNames).split(' ')[1]}`;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}+${i}@example.com`;
    const p = await prisma.patient.upsert({
      where: { email },
      update: {},
      create: { name, email, phone: rand(0, 1) ? `+1${rand(2000000000, 9999999999)}` : null },
    });
    patients.push({ id: p.id, name: p.name, email: p.email });
  }
  console.log(`👥 Seeded ${patients.length} patients`);

  // Products (upsert ensures idempotency)
  const productCatalog = [
    { name: 'Insulin Pen (Humalog)', sku: 'INS-HUM-001', priceCents: 12500, costCents: 8500, quantity: 25, expirationDate: new Date('2026-12-31'), parLevel: 10 },
    { name: 'Blood Pressure Monitor', sku: 'BPM-DIG-001', priceCents: 7999, costCents: 5200, quantity: 15, expirationDate: null, parLevel: 5 },
    { name: 'Glucose Test Strips (50 ct)', sku: 'GTS-50-001', priceCents: 2499, costCents: 1200, quantity: 40, expirationDate: new Date('2026-06-30'), parLevel: 20 },
    { name: 'Digital Thermometer', sku: 'THM-DIG-001', priceCents: 1999, costCents: 900, quantity: 30, expirationDate: null, parLevel: 15 },
    { name: 'Metformin 500mg (30 tabs)', sku: 'MET-500-30', priceCents: 1200, costCents: 500, quantity: 50, expirationDate: new Date('2026-03-15'), parLevel: 25 },
    { name: 'Amoxicillin 500mg (20 caps)', sku: 'AMX-500-20', priceCents: 1899, costCents: 900, quantity: 35, expirationDate: new Date('2026-11-20'), parLevel: 20 },
    { name: 'Gauze Pads (100 pack)', sku: 'GAU-100-001', priceCents: 1599, costCents: 700, quantity: 200, expirationDate: null, parLevel: 100 },
    { name: 'Surgical Masks (50 pack)', sku: 'MSK-50-001', priceCents: 1299, costCents: 500, quantity: 300, expirationDate: null, parLevel: 150 },
  ];
  for (const p of productCatalog) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }
  const createdProducts = await prisma.product.findMany();
  console.log(`📦 Products available: ${createdProducts.length}`);

  // Helper to pick unique items
  const sampleUnique = <T,>(arr: T[], count: number): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
  };

  // Generate orders for the past 60 days
  const daysBack = 60;
  const statuses: ('PENDING' | 'PAID' | 'FULFILLED')[] = ['PENDING', 'PAID', 'FULFILLED'];
  let createdOrders = 0;
  let createdPayments = 0;

  for (let d = daysBack; d >= 0; d--) {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - d);

    // 20% stock replenishment orders to simulate expenses
    const stockCount = rand(0, 2);
    for (let i = 0; i < stockCount; i++) {
      const itemsCount = rand(1, 3);
      const picked = sampleUnique(createdProducts, itemsCount);
      const items = [] as { productId: string; quantity: number }[];
      let total = 0;
      for (const product of picked) {
        const qty = rand(5, 25);
        total += (product as any).costCents * qty;
        items.push({ productId: product.id, quantity: qty });
        // Increase inventory to reflect replenishment
        await prisma.product.update({ where: { id: product.id }, data: { quantity: product.quantity + qty } });
      }
      const order = await prisma.order.create({
        data: {
          patientName: 'Stock Order',
          patientEmail: 'inventory@medportal.com',
          doctorId: null,
          totalCents: total,
          status: 'FULFILLED',
          createdAt: day,
          items: { create: items },
        },
      });
      createdOrders++;
    }

    // Patient purchases
    const orderCount = rand(3, 10);
    for (let i = 0; i < orderCount; i++) {
      const patient = pick(patients);
      const doctor = pick(doctors);
      const itemsCount = rand(1, 3);
      const picked = sampleUnique(createdProducts, itemsCount);
      const items = [] as { productId: string; quantity: number }[];
      let total = 0;
      for (const product of picked) {
        const qty = rand(1, 3);
        total += product.priceCents * qty;
        items.push({ productId: product.id, quantity: qty });
        // Decrease inventory for patient orders
        await prisma.product.update({ where: { id: product.id }, data: { quantity: Math.max(0, product.quantity - qty) } });
      }
      const status = pick(statuses) as any;
      const order = await prisma.order.create({
        data: {
          patientName: patient.name,
          patientEmail: patient.email,
          doctorId: doctor.id,
          totalCents: total,
          status,
          createdAt: new Date(day.getTime() + rand(0, 10) * 60 * 60 * 1000),
          items: { create: items },
        },
      });
      createdOrders++;

      if (status === 'PAID' || status === 'FULFILLED') {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            stripePaymentIntentId: `pi_${order.id.replace(/-/g, '').slice(0, 20)}_${rand(1000, 9999)}`,
            status: 'SUCCEEDED',
            amountCents: total,
            createdAt: order.createdAt,
          },
        });
        createdPayments++;
      }
    }
  }

  console.log(`🧾 Created ${createdOrders} orders and ${createdPayments} payments over the last ${daysBack} days`);

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