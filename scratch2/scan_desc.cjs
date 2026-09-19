const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany();
  let count = 0;
  for (const p of products) {
    if (!p.description) continue;
    
    let matched = false;
    
    // Look for lists in descriptions
    const sizeMatch = p.description.match(/(tamaños|medidas|talles|colores|capacidades|espesores).*?:\s*([^\n]+)/i);
    
    if (sizeMatch) {
      const parts = sizeMatch[2].split(/[\-,\/y]+/).map(s => s.trim()).filter(Boolean);
      if (parts.length > 1 && parts.length < 15) {
        // Excluir si la palabra "Set" o "Juego" o "Kit" está en el nombre
        if (p.name.match(/set|juego|kit/i)) continue;
        // Excluir si el nombre menciona "Remachadora" (porque las medidas son de los picos)
        if (p.name.match(/remachadora/i)) continue;
        
        console.log(`\nPRODUCTO: ${p.name}`);
        console.log(`-> TEXTO: ${sizeMatch[0].trim()}`);
        console.log(`-> EXTRACCION: ${parts.join(' | ')}`);
        matched = true;
      }
    }
    
    if (matched) count++;
  }
  console.log(`\nTotal filtrado: ${count}`);
}
main().finally(() => prisma.$disconnect());
