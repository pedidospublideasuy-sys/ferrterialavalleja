const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({
    where: { name: { contains: 'Escuadra Para Refuerzo Bicromatizada' } },
    include: { variants: true }
  });
  console.dir(p, { depth: null });
}
main().finally(() => prisma.$disconnect());
