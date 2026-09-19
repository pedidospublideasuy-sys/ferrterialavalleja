const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.product.count();
  console.log(`Productos en ep-calm-scene: ${count}`);
}
main().finally(() => prisma.$disconnect());
