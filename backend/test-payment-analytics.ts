import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPaymentAnalytics() {
  console.log('🧪 Testing Payment Analytics...');

  try {
    // Create test payment records if none exist
    const existingPayments = await prisma.payment.count();
    
    if (existingPayments === 0) {
      console.log('📦 Creating test payment data...');
      
      // Get an existing order
      const order = await prisma.order.findFirst();
      
      if (order) {
        // Create some test payments
        await prisma.payment.createMany({
          data: [
            {
              orderId: order.id,
              stripePaymentIntentId: 'pi_test_1',
              amountCents: 12500,
              status: 'SUCCEEDED',
            },
            {
              orderId: order.id,
              stripePaymentIntentId: 'pi_test_2',
              amountCents: 7999,
              status: 'SUCCEEDED',
            },
            {
              orderId: order.id,
              stripePaymentIntentId: 'pi_test_3',
              amountCents: 2499,
              status: 'FAILED',
            },
          ],
        });
        console.log('✅ Test payment data created');
      }
    }

    // Test payment analytics queries
    console.log('📊 Testing analytics queries...');

    const totalPayments = await prisma.payment.count();
    console.log(`Total payments: ${totalPayments}`);

    const successfulPayments = await prisma.payment.count({
      where: { status: 'SUCCEEDED' }
    });
    console.log(`Successful payments: ${successfulPayments}`);

    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amountCents: true }
    });
    console.log(`Total revenue: $${((totalRevenue._sum.amountCents || 0) / 100).toFixed(2)}`);

    const averageOrderValue = await prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _avg: { amountCents: true }
    });
    console.log(`Average order value: $${((averageOrderValue._avg.amountCents || 0) / 100).toFixed(2)}`);

    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    console.log(`Success rate: ${successRate.toFixed(2)}%`);

    // Test recent payments query
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { patientName: true }
        }
      }
    });
    
    console.log(`Recent payments: ${recentPayments.length} found`);
    recentPayments.forEach(payment => {
      console.log(`  - $${(payment.amountCents / 100).toFixed(2)} | ${payment.status} | ${payment.order.patientName}`);
    });

    console.log('✅ Payment analytics test completed successfully!');

  } catch (error) {
    console.error('❌ Payment analytics test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentAnalytics();