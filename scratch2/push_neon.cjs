const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const products = JSON.parse(fs.readFileSync('scratch2/neon_export_products.json', 'utf8'));
  const variations = JSON.parse(fs.readFileSync('scratch2/neon_export_variations.json', 'utf8'));

  console.log(`Importing ${products.length} products...`);
  
  let pCount = 0;
  const dbProductsMap = {}; // old ID -> new Neon ID

  for (const p of products) {
    let cat = await prisma.category.findFirst({ where: { name: p.category } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') } });
    }
    
    // Some titles might have spaces or weird chars, we need a slug
    const pSlug = (p.sku || p.id.toString()).toLowerCase().replace(/\s+/g, '-');
    const imagesStr = p.image ? JSON.stringify([p.image]) : "[]";

    try {
      const saved = await prisma.product.upsert({
        where: { sku: p.sku },
        update: { name: p.name, price: p.price, stock: p.stock, categoryId: cat.id, images: imagesStr, active: true },
        create: { sku: p.sku, slug: pSlug, name: p.name, price: p.price, stock: p.stock, categoryId: cat.id, images: imagesStr, active: true }
      });
      dbProductsMap[p.id] = saved.id;
      pCount++;
    } catch (e) {
      console.log(`Error saving product ${p.sku}`);
    }
  }
  
  console.log(`Successfully imported ${pCount} products. Now importing variations...`);
  let vCount = 0;

  for (const v of variations) {
    const parentDbId = dbProductsMap[v.parent_id];
    if (!parentDbId) {
      console.log(`Parent not found for variation ${v.sku} (parent ID: ${v.parent_id})`);
      continue;
    }
    
    const attrStr = JSON.stringify(v.attributes);
    let variantName = Object.values(v.attributes).join(' ');
    if (!variantName) variantName = v.name;

    try {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { name: variantName, price: v.price, stock: v.stock, attributes: attrStr, imageUrl: v.image, productId: parentDbId },
        create: { sku: v.sku, name: variantName, price: v.price, stock: v.stock, attributes: attrStr, imageUrl: v.image, productId: parentDbId }
      });
      vCount++;
    } catch (e) {
      console.log(`Error saving variation ${v.sku}`);
    }
  }

  console.log(`Successfully imported ${vCount} variations.`);
}

main().finally(() => prisma.$disconnect());
