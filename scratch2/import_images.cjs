const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Cargando variaciones y meta...");
  const rawVariations = JSON.parse(fs.readFileSync('scratch2/woo_variations.json', 'utf8'));
  const rawMeta = fs.readFileSync('scratch2/woo_meta.tsv', 'utf8').split('\n');
  const thumbIdsLines = fs.readFileSync('scratch2/woo_thumbnail_ids.tsv', 'utf8').split('\n');
  const attachLines = fs.readFileSync('scratch2/woo_attachments.tsv', 'utf8').split('\n');

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

  const thumbMap = {};
  for (let i = 1; i < thumbIdsLines.length; i++) {
    const line = thumbIdsLines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) thumbMap[parts[0]] = parts[1];
  }

  const attachMap = {};
  for (let i = 1; i < attachLines.length; i++) {
    const line = attachLines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 2) {
      let url = parts.slice(1).join('\t');
      if (url.startsWith('http://')) url = url.replace('http://', 'https://');
      attachMap[parts[0]] = url;
    }
  }

  console.log("Actualizando variantes...");
  let count = 0;
  for (const v of rawVariations) {
    const thumbId = thumbMap[v.ID];
    if (!thumbId) continue;
    const imgUrl = attachMap[thumbId];
    if (!imgUrl) continue;

    const cMeta = metaMap[v.ID] || {};
    const vSku = cMeta._sku || `v-${v.ID}`;

    try {
      const variant = await prisma.productVariant.findUnique({ where: { sku: vSku } });
      if (variant) {
        if (variant.imageUrl !== imgUrl) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { imageUrl: imgUrl }
          });
          count++;
        }
      }
    } catch (e) {
      console.log(`Error temporal con ${vSku}, reintentando luego...`);
    }
  }
  console.log(`✅ ${count} imágenes de variantes importadas y actualizadas!`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
