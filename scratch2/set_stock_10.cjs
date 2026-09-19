const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Actualizando stock de productos principales...");
  const pResult = await prisma.product.updateMany({
    data: { stock: 10 }
  });
  console.log(`Productos actualizados: ${pResult.count}`);

  console.log("Actualizando stock de variaciones...");
  const vResult = await prisma.productVariant.updateMany({
    data: { stock: 10 }
  });
  console.log(`Variaciones actualizadas: ${vResult.count}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
