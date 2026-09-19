const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Cargando archivos...");
  const rawProducts = JSON.parse(fs.readFileSync('scratch2/woo_products.json', 'utf8'));
  const rawVariations = JSON.parse(fs.readFileSync('scratch2/woo_variations.json', 'utf8'));
  const rawMeta = fs.readFileSync('scratch2/woo_meta.tsv', 'utf8').split('\n');

  console.log("Procesando meta data...");
  const metaMap = {}; 
  for (let i = 1; i < rawMeta.length; i++) {
    const line = rawMeta[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 3) {
      const postId = parts[0];
      const key = parts[1];
      const value = parts.slice(2).join('\t');
      if (!metaMap[postId]) metaMap[postId] = {};
      metaMap[postId][key] = value;
    }
  }

  console.log("Agrupando variaciones...");
  const varsByParent = {};
  for (const v of rawVariations) {
    if (!varsByParent[v.post_parent]) varsByParent[v.post_parent] = [];
    varsByParent[v.post_parent].push(v);
  }

  const generalCat = await prisma.category.findFirst({ where: { name: 'General' } });
  if (!generalCat) {
    console.log("No existe categoria General, usando el primer disponible");
  }
  const defaultCat = generalCat || await prisma.category.findFirst();

  console.log("Importando productos y sus variaciones...");
  let count = 0;
  for (const p of rawProducts) {
    const parentId = p.ID;
    const children = varsByParent[parentId] || [];
    if (children.length === 0) continue;

    const slug = p.post_name;
    const existing = await prisma.product.findFirst({ where: { name: p.post_title } });
    let dbProductId = existing?.id;

    if (!existing) {
      const pMeta = metaMap[parentId] || {};
      const newP = await prisma.product.create({
        data: {
          name: p.post_title,
          sku: pMeta._sku || p.post_name,
          slug: slug,
          price: parseFloat(pMeta._price || '0') || 0,
          categoryId: defaultCat.id,
          active: true
        }
      });
      dbProductId = newP.id;
    } else {
      console.log(`Producto ya existe: ${p.post_title}, actualizando variaciones...`);
    }

    for (const child of children) {
      const cMeta = metaMap[child.ID] || {};
      
      const attrs = {};
      for (const k in cMeta) {
        if (k.startsWith('attribute_pa_')) {
          attrs[k.replace('attribute_pa_', '')] = cMeta[k];
        }
      }
      const attrStr = JSON.stringify(attrs);
      let variantName = Object.values(attrs).join(' ');
      if (!variantName || variantName.trim() === '') {
        variantName = child.post_title.replace(p.post_title, '').replace('-', '').trim();
      }
      if (!variantName) variantName = 'Variante ' + child.ID;

      const vSku = cMeta._sku || null;
      let vPrice = parseFloat(cMeta._price || '0');
      if (isNaN(vPrice)) vPrice = 0;
      let vStock = parseInt(cMeta._stock || '0');
      if (isNaN(vStock)) vStock = 0;

      // Unique sku fallback
      const skuToUse = vSku || `v-${child.ID}`;
      
      // Check if variant with sku already exists
      const exVar = await prisma.productVariant.findUnique({ where: { sku: skuToUse } });
      if (exVar) {
        await prisma.productVariant.update({
          where: { sku: skuToUse },
          data: { name: variantName, price: vPrice, stock: vStock, attributes: attrStr }
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: dbProductId,
            name: variantName,
            sku: skuToUse,
            price: vPrice,
            stock: vStock,
            attributes: attrStr
          }
        });
      }
    }
    count++;
  }

  console.log("Finalizado con exito. Importados: " + count);
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
