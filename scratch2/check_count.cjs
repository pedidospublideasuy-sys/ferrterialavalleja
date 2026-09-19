const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.productVariant.count({
    where: {
      imageUrl: { not: null }
    }
  });
  console.log(`Variantes con imagen: ${count}`);
}
main().finally(() => prisma.$disconnect());
