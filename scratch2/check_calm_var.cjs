const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.productVariant.count();
  console.log(`Variantes en ep-calm-scene: ${count}`);
}
main().finally(() => prisma.$disconnect());
