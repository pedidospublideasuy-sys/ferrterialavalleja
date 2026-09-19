const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p1 = await prisma.product.findMany({ where: { name: { contains: 'Canatech', mode: 'insensitive' } }, include: { variants: true } });
  const p2 = await prisma.product.findMany({ where: { name: { contains: 'Cola Carpintero', mode: 'insensitive' } }, include: { variants: true } });
  const p3 = await prisma.product.findMany({ where: { name: { contains: 'WD-40', mode: 'insensitive' } }, include: { variants: true } });
  
  console.log(p1.map(p => `${p.name} - Variantes: ${p.variants.length}`));
  console.log(p2.map(p => `${p.name} - Variantes: ${p.variants.length}`));
  console.log(p3.map(p => `${p.name} - Variantes: ${p.variants.length}`));
}
main().finally(() => prisma.$disconnect());
