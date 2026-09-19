const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({
    where: { name: { contains: 'Escuadra Para Refuerzo Bicromatizada' } }
  });
  console.log(p.description);
}
main().finally(() => prisma.$disconnect());
