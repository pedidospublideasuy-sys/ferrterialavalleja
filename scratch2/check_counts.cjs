const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const variableCount = await prisma.product.count({
    where: { variants: { some: {} } }
  });
  console.log('Products with variants:', variableCount);
  const totalVariants = await prisma.productVariant.count();
  console.log('Total variants:', totalVariants);
}
main().finally(() => prisma.$disconnect());
