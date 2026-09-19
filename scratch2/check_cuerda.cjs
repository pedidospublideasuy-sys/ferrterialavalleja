const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findMany({
    where: { name: { contains: 'cuerda nautica', mode: 'insensitive' } }
  });
  console.log("Cuerda nautica found:");
  p.forEach(x => console.log(`- ${x.name} (cat: ${x.categoryId})`));
}

main().finally(() => prisma.$disconnect());
