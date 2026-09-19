const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pCount = await prisma.product.count();
  const vCount = await prisma.productVariant.count();
  console.log(`Neon Products: ${pCount}`);
  console.log(`Neon Variants: ${vCount}`);
}
main().finally(() => prisma.$disconnect());
