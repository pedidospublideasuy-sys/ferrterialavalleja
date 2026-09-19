const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany();
  let count = 0;
  for (const p of products) {
    if (!p.description) continue;
    
    let matched = false;
    
    // Look for patterns like "Tamaños: 20-30-40" or "Medidas: S-M-L"
    const sizeMatch = p.description.match(/(tamaños|medidas|talles).*?:\s*([\w\d\s\-,\.]+)/i);
    if (sizeMatch) {
      const parts = sizeMatch[2].split(/[\-,\,]/).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1 && parts.length < 20) {
        console.log(`\nPRODUCTO: ${p.name}`);
        console.log(`-> PATRON: ${sizeMatch[0].trim()}`);
        console.log(`-> EXTRAÍDO: ${parts.join(' | ')}`);
        matched = true;
      }
    }
    
    if (matched) count++;
  }
  console.log(`\nEncontrados ${count} productos con variables en la descripcion.`);
}
main().finally(() => prisma.$disconnect());
