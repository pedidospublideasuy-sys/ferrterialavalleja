const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findMany({
    where: { name: { contains: 'Escuadra Para Refuerzo' } }
  });
  console.log(p.map(x => x.name + ' - $' + x.price));
}
main().finally(() => prisma.$disconnect());
