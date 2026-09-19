const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function normalizeUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://')) return url.replace('http://', 'https://');
  return url;
}

async function main() {
  console.log("Reading exported data...");
  const rawProducts = JSON.parse(fs.readFileSync('scratch2/woo_all_products.json', 'utf8'));
  const rawMeta = fs.readFileSync('scratch2/woo_meta.tsv', 'utf8').split('\n');
  const rawAttach = fs.readFileSync('scratch2/woo_attachments.tsv', 'utf8').split('\n');
  const rawTax = fs.readFileSync('scratch2/woo_taxonomies.tsv', 'utf8').split('\n');

  // Parse meta
  const metaMap = {};
  for (let i = 1; i < rawMeta.length; i++) {
    const line = rawMeta[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 3) {
      if (!metaMap[parts[0]]) metaMap[parts[0]] = {};
      metaMap[parts[0]][parts[1]] = parts.slice(2).join('\t');
    }
  }

  // Parse attachments
  const attachMap = {};
  for (let i = 1; i < rawAttach.length; i++) {
    const line = rawAttach[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) attachMap[parts[0]] = normalizeUrl(parts.slice(1).join('\t'));
  }

  // Parse taxonomies
  const taxMap = {}; // object_id -> { category: [], brand: [] }
  for (let i = 1; i < rawTax.length; i++) {
    const line = rawTax[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 3) {
      const objId = parts[0];
      const termName = parts[1];
      const taxonomy = parts[2];
      
      if (!taxMap[objId]) taxMap[objId] = { category: [], brand: [] };
      if (taxonomy === 'product_cat') taxMap[objId].category.push(termName);
      if (taxonomy === 'product_brand') taxMap[objId].brand.push(termName);
    }
  }

  // Find clones
  console.log("Filtering out clones...");
  const cloneIds = new Set();
  for (const pId in metaMap) {
    const sku = metaMap[pId]._sku;
    if (sku && sku.toUpperCase().startsWith('WC-')) {
      cloneIds.add(parseInt(pId));
    }
  }

  // Filter valid products and group variations
  const validProducts = [];
  const variationsMap = {};

  for (const p of rawProducts) {
    if (cloneIds.has(p.ID)) continue;
    
    if (p.post_type === 'product_variation') {
      if (!variationsMap[p.post_parent]) variationsMap[p.post_parent] = [];
      variationsMap[p.post_parent].push(p);
    } else if (p.post_type === 'product') {
      validProducts.push(p);
    }
  }

  console.log(`Original products to import: ${validProducts.length}`);

  let successCount = 0;
  for (const p of validProducts) {
    const pMeta = metaMap[p.ID] || {};
    const pTax = taxMap[p.ID] || { category: [], brand: [] };
    
    let categoryId = null;
    if (pTax.category.length > 0) {
      let cat = await prisma.category.findFirst({ where: { name: pTax.category[0] } });
      if (!cat) {
        cat = await prisma.category.create({ data: { name: pTax.category[0], slug: pTax.category[0].toLowerCase().replace(/\s+/g, '-') } });
      }
      categoryId = cat.id;
    } else {
      let general = await prisma.category.findFirst({ where: { name: 'General' } });
      if (!general) general = await prisma.category.create({ data: { name: 'General', slug: 'general' } });
      categoryId = general.id;
    }

    const price = parseFloat(pMeta._price || '0') || 0;
    const stock = parseInt(pMeta._stock || '0') || 0;
    const sku = pMeta._sku || p.post_name;
    const thumbId = pMeta._thumbnail_id;
    const imageUrl = thumbId ? attachMap[thumbId] : null;

    let retries = 0;
    let savedP = null;
    while (!savedP && retries < 3) {
      try {
        savedP = await prisma.product.upsert({
          where: { sku: sku },
          update: { name: p.post_title, price, stock, categoryId, imageUrl, active: true },
          create: { sku, slug: sku, name: p.post_title, price, stock, categoryId, imageUrl, active: true }
        });
      } catch (e) {
        retries++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!savedP) {
      console.log(`Failed to save product ${sku}`);
      continue;
    }

    successCount++;

    // Save variations
    const children = variationsMap[p.ID] || [];
    for (const child of children) {
      if (cloneIds.has(child.ID)) continue;
      
      const cMeta = metaMap[child.ID] || {};
      const attrs = {};
      for (const k in cMeta) {
        if (k.startsWith('attribute_pa_')) attrs[k.replace('attribute_pa_', '')] = cMeta[k];
      }
      const attrStr = JSON.stringify(attrs);
      let variantName = Object.values(attrs).join(' ') || child.post_title.replace(p.post_title, '').trim() || p.post_title;
      const vSku = cMeta._sku || `v-${child.ID}`;
      const vPrice = parseFloat(cMeta._price || '0') || 0;
      const vStock = parseInt(cMeta._stock || '0') || 0;
      const vThumbId = cMeta._thumbnail_id;
      const vImgUrl = vThumbId ? attachMap[vThumbId] : null;

      try {
        await prisma.productVariant.upsert({
          where: { sku: vSku },
          update: { name: variantName, price: vPrice, stock: vStock, attributes: attrStr, imageUrl: vImgUrl, productId: savedP.id },
          create: { productId: savedP.id, sku: vSku, name: variantName, price: vPrice, stock: vStock, attributes: attrStr, imageUrl: vImgUrl }
        });
      } catch (e) {
        // ignore
      }
    }
  }

  console.log(`Successfully imported ${successCount} original products (and their variants)!`);
}

main().finally(() => prisma.$disconnect());
