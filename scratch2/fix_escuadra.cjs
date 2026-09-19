const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findFirst({
    where: { name: 'Escuadra Para Refuerzo Bicromatizada' }
  });
  
  if (!p) {
    console.log("No encontrado");
    return;
  }
  
  // Borrar variantes actuales
  await prisma.productVariant.deleteMany({
    where: { productId: p.id }
  });
  
  // Crear las nuevas
  const sizes = ['20mm', '30mm', '40mm', '50mm', '60mm', '80mm', '100mm'];
  for (const size of sizes) {
    await prisma.productVariant.create({
      data: {
        productId: p.id,
        name: size,
        price: p.price,
        stock: 100,
        active: true,
        attributes: '{}'
      }
    });
  }
  
  console.log("Variantes creadas para la Escuadra!");
}
main().finally(() => prisma.$disconnect());
