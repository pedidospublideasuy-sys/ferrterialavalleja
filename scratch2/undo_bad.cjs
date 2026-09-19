const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const rawProducts = JSON.parse(fs.readFileSync('scratch2/woo_products.json', 'utf8'));
  const rawVariations = JSON.parse(fs.readFileSync('scratch2/woo_variations.json', 'utf8'));
  const rawMeta = fs.readFileSync('scratch2/woo_meta.tsv', 'utf8').split('\n');

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

  let toDeleteSkus = [];
  for (const p of rawProducts) {
    if (!titlesToFix.includes(p.post_title)) continue;
    const children = varsByParent[p.ID] || [];
    for (const child of children) {
      const cMeta = metaMap[child.ID] || {};
      const vSku = cMeta._sku || `v-${child.ID}`;
      toDeleteSkus.push(vSku);
    }
  }

  console.log(`Borrando ${toDeleteSkus.length} variantes con sku mal matcheados...`);
  const res = await prisma.productVariant.deleteMany({
    where: { sku: { in: toDeleteSkus } }
  });
  console.log(`Borradas ${res.count} variantes!`);
}

main().finally(() => prisma.$disconnect());
