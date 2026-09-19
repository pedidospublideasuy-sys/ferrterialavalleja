const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({
    where: { description: { contains: 'Tamaños' } }
  });
  console.log(`Found ${products.length} products with 'Tamaños' in description`);
  for (let p of products) {
    const match = p.description.match(/Tamaños.*?:\s*([\d\s\-]+)/i);
    if (match) {
       console.log(p.name, '->', match[1].trim());
    }
  }
}
main().finally(() => prisma.$disconnect());
