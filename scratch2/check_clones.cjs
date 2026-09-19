const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const pClones = await prisma.product.count({ where: { sku: { startsWith: 'WC-', mode: 'insensitive' } } });
  const vClones = await prisma.productVariant.count({ where: { sku: { startsWith: 'WC-', mode: 'insensitive' } } });
  
  console.log(`Clones in Products: ${pClones}`);
  console.log(`Clones in ProductVariants: ${vClones}`);
}
main().finally(() => prisma.$disconnect());
