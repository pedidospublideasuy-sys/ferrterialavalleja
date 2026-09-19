const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    include: { items: true }
  });
  
  let updated = 0;
  for (const order of orders) {
    if (order.totalUYU === 0 && order.totalUSD === 0 && order.total > 0) {
      // Legacy order
      let totalUYU = 0;
      let totalUSD = 0;
      for (const item of order.items) {
        if (item.currency === 'USD') {
          totalUSD += item.subtotal;
        } else {
          totalUYU += item.subtotal;
        }
      }
      
      // If we still can't tell, assume UYU for legacy compatibility
      if (totalUYU === 0 && totalUSD === 0) {
        totalUYU = order.total;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          totalUYU,
          totalUSD
        }
      });
      updated++;
    }
  }
  
  console.log(`Migrated ${updated} legacy orders.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
