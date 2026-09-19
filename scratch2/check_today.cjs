const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({ 
    where: { createdAt: { gt: new Date(Date.now() - 1000 * 60 * 60 * 4) } } 
  });
  console.log(`Products created today: ${products.length}`);
}
main().finally(() => prisma.$disconnect());
