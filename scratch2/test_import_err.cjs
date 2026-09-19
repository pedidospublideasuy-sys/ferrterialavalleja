const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
  const products = JSON.parse(fs.readFileSync('scratch2/neon_export_products.json', 'utf8'));
  const p = products[0];
  const cat = await prisma.category.findFirst();
  try {
    const saved = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, price: p.price, stock: p.stock, categoryId: cat.id, imageUrl: p.image, active: true },
      create: { sku: p.sku, slug: p.sku, name: p.name, price: p.price, stock: p.stock, categoryId: cat.id, imageUrl: p.image, active: true }
    });
    console.log("Success:", saved.id);
  } catch (e) {
    console.log("Error:");
    console.log(e);
  }
}
main().finally(() => prisma.$disconnect());
