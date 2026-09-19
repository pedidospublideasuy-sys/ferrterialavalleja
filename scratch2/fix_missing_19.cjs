const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const rawProducts = JSON.parse(fs.readFileSync('scratch2/woo_products.json', 'utf8'));
  const rawVariations = JSON.parse(fs.readFileSync('scratch2/woo_variations.json', 'utf8'));
  const rawMeta = fs.readFileSync('scratch2/woo_meta.tsv', 'utf8').split('\n');

  // get those 19 that were missing
  const titlesToFix = [
    "FILM DE ENMASCARAR 0.90X20 MT",
    "CUERDA NAUTICA MULTIFILAMENTO 4 MM",
    "CUERDA NAUTICA MULTIFILAMENTO 8 MM",
    "CUERDA NAUTICA MULTIFILAMENTO 6 MM",
    "CUERDA NAUTICA MULTIFILAMENTO 10 MM",
    "CUERDA NAUTICA MULTIFILAMENTO 12 MM",
    "CINTA PARA YESO - DE FIBRA-ARCAL",
    "PINTURA EN AEROSOL PENSSYLVANIA",
    "MONOCOMANDO PARA COCINA PICO FLEXIBLE 6 colores",
    "PINCELES - PINCEL DE CERDA BLANCA, MANGO LAQUEADO",
    "PINCELES - PINCEL ATLAS - 395",
    "PINCELES - PINCEL BULIT",
    "PINCELES - PINCEL BIBER",
    "Ménsulas Para Estantes Color Blanco",
    "Escuadra para refuerzo bicromatizada",
    "Ménsulas Para Estantes Color gris",
    "Tacos Deco TOX 6-8-10-12",
    "Cinta adhesiva, Doble Faz Reutilizable - Nano Tape, transparente,",
    "CINTA PARA YESO - DE FIBRA- COSTRUTECH"
  ];

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

  const varsByParent = {};
  for (const v of rawVariations) {
    if (!varsByParent[v.post_parent]) varsByParent[v.post_parent] = [];
    varsByParent[v.post_parent].push(v);
  }

  for (const p of rawProducts) {
    if (!titlesToFix.includes(p.post_title)) continue;
    
    // Find the real product in Neon
    // Let's strip dimensions and common suffixes to find it
    let searchName = p.post_title
      .replace(/\\b\\d+(\\.\\d+)?[A-Za-z]+\\b/gi, '') // remove "4 MM", "0.90X20 MT"
      .replace(/\\d+\\s*(mm|cm|mt|ml|lt|kg)/gi, '')
      .replace(/\\b(color blanco|color gris|blanca|gris|transparente)\\b/gi, '')
      .replace(/-|\\.|,|\\|/g, ' ')
      .replace(/\\s+/g, ' ')
      .trim();
      
    // Custom overrides for specific ones
    if (p.post_title.includes("CINTA PARA YESO - DE FIBRA")) searchName = "Cinta para yeso fibra";
    if (p.post_title.includes("PINTURA EN AEROSOL PENSSYLVANIA")) searchName = "Pintura en aerosol"; // misspelled in woo
    if (p.post_title.includes("MONOCOMANDO PARA COCINA PICO FLEXIBLE")) searchName = "Monocomando";
    if (p.post_title.includes("PINCELES")) searchName = "Pinceles";
    if (p.post_title.includes("Ménsulas Para Estantes Color")) searchName = "Mensulas Para Estantes";
    if (p.post_title.includes("Escuadra para refuerzo")) searchName = "Escuadra para refuerzo";
    if (p.post_title.includes("Tacos Deco TOX")) searchName = "Tacos Deco Tox";
    if (p.post_title.includes("Cinta adhesiva, Doble Faz")) searchName = "Cinta adhesiva doble faz";

    // Grab ALL products that might match
    const matches = await prisma.product.findMany({
      where: { name: { contains: searchName.split(' ')[0], mode: 'insensitive' } }
    });
    
    let bestMatch = null;
    let maxMatchWords = 0;
    
    const searchWords = searchName.toLowerCase().split(' ');
    for (const m of matches) {
      let matchWords = 0;
      const mWords = m.name.toLowerCase().split(' ');
      for (const sw of searchWords) {
        if (mWords.some(mw => mw.includes(sw) || sw.includes(mw))) matchWords++;
      }
      if (matchWords > maxMatchWords) {
        maxMatchWords = matchWords;
        bestMatch = m;
      }
    }

    if (!bestMatch) {
      console.log(`NO MATCH FOR: ${p.post_title} (search: ${searchName})`);
      continue;
    }
    
    console.log(`Matched '${p.post_title}' TO '${bestMatch.name}'`);

    const children = varsByParent[p.ID] || [];
    for (const child of children) {
      const cMeta = metaMap[child.ID] || {};
      const attrs = {};
      for (const k in cMeta) {
        if (k.startsWith('attribute_pa_')) attrs[k.replace('attribute_pa_', '')] = cMeta[k];
      }
      const attrStr = JSON.stringify(attrs);
      let variantName = Object.values(attrs).join(' ');
      if (!variantName) variantName = child.post_title.replace(p.post_title, '').trim() || p.post_title;

      const vSku = cMeta._sku || `v-${child.ID}`;
      const vPrice = parseFloat(cMeta._price || '0') || 0;
      const vStock = parseInt(cMeta._stock || '0') || 0;

      await prisma.productVariant.upsert({
        where: { sku: vSku },
        update: { name: variantName, price: vPrice, stock: vStock, attributes: attrStr, productId: bestMatch.id },
        create: { productId: bestMatch.id, name: variantName, sku: vSku, price: vPrice, stock: vStock, attributes: attrStr }
      });
    }
  }
}
main().finally(() => prisma.$disconnect());
