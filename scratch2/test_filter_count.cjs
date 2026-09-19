const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c1 = await prisma.product.count({ where: { variants: { some: {} } } });
  const c2 = await prisma.product.count({ where: { variants: { none: {} } } });
  const c3 = await prisma.product.count();
  console.log(`Variables: ${c1}, Simples: ${c2}, Todos: ${c3}`);
}
main().finally(() => prisma.$disconnect());
