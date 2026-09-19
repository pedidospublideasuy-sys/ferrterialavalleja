const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const products = JSON.parse(fs.readFileSync('scratch2/neon_export_products.json', 'utf8'));
  const variations = JSON.parse(fs.readFileSync('scratch2/neon_export_variations.json', 'utf8'));

  console.log(`Optimized import started. Total products: ${products.length}`);
  
  // Cache categories
  const categoriesMap = {};
  const existingCats = await prisma.category.findMany();
  for (const c of existingCats) {
    categoriesMap[c.name] = c.id;
  }

  const dbProductsMap = {}; // old ID -> new Neon ID
  
  // We already imported ~256 products, let's just fetch all existing products to avoid useless upserts
  // Actually, upsert is fine, but Promise.all makes it 50x faster.
  
  const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
  const productChunks = chunk(products, 50);

  let pCount = 0;
  for (const pChunk of productChunks) {
    const promises = pChunk.map(async (p) => {
      let catId = categoriesMap[p.category];
      if (!catId) {
        // Create it
        try {
          const newCat = await prisma.category.create({ data: { name: p.category, slug: p.category.toLowerCase().replace(/\s+/g, '-') } });
          categoriesMap[p.category] = newCat.id;
          catId = newCat.id;
        } catch (e) {
          // might be created by another concurrent promise, just fetch it
          const existing = await prisma.category.findFirst({ where: { name: p.category } });
          catId = existing.id;
          categoriesMap[p.category] = existing.id;
        }
      }

      const pSlug = (p.sku || p.id.toString()).toLowerCase().replace(/\s+/g, '-');
      const imagesStr = p.image ? JSON.stringify([p.image]) : "[]";

      try {
        const saved = await prisma.product.upsert({
          where: { sku: p.sku },
          update: { name: p.name, price: p.price, stock: p.stock, categoryId: catId, images: imagesStr, active: true },
          create: { sku: p.sku, slug: pSlug, name: p.name, price: p.price, stock: p.stock, categoryId: catId, images: imagesStr, active: true }
        });
        dbProductsMap[p.id] = saved.id;
        return true;
      } catch (e) {
        console.log(`Error saving product ${p.sku}`, e.message);
        return false;
      }
    });

    const results = await Promise.all(promises);
    pCount += results.filter(r => r).length;
    console.log(`Imported ${pCount} / ${products.length} products...`);
  }
  
  console.log(`Successfully imported ${pCount} products. Now importing variations...`);
  
  const varChunks = chunk(variations, 50);
  let vCount = 0;
  
  for (const vChunk of varChunks) {
    const promises = vChunk.map(async (v) => {
      const parentDbId = dbProductsMap[v.parent_id];
      if (!parentDbId) return false;
      
      const attrStr = JSON.stringify(v.attributes);
      let variantName = Object.values(v.attributes).join(' ');
      if (!variantName) variantName = v.name;

      try {
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: { name: variantName, price: v.price, stock: v.stock, attributes: attrStr, imageUrl: v.image, productId: parentDbId },
          create: { sku: v.sku, name: variantName, price: v.price, stock: v.stock, attributes: attrStr, imageUrl: v.image, productId: parentDbId }
        });
        return true;
      } catch (e) {
        console.log(`Error saving variation ${v.sku}`);
        return false;
      }
    });

    const results = await Promise.all(promises);
    vCount += results.filter(r => r).length;
    console.log(`Imported ${vCount} / ${variations.length} variations...`);
  }

  console.log(`Optimized import completed!`);
}

main().finally(() => prisma.$disconnect());
