const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_Bd38FNUIMSah@ep-winter-grass-b4d7zlkm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, sku: true, price: true }
  });

  const groups = {};

  for (const p of products) {
    let name = p.name.trim().toLowerCase();
    
    // Normalize spaces and common punctuation
    name = name.replace(/\s+/g, ' ');
    
    let baseName = name;
    
    // Pattern 1: Strip trailing sizes and colors, or anything after a hyphen
    baseName = baseName.replace(/\b(blanco|negra|negro|roja|rojo|azul|verde|amarillo|gris|marron|marrón|transparente|natural)\b/gi, '')
                       .replace(/\b\d+(\.\d+)?\s*(mm|cm|m|kg|g|l|ml|pulgadas|"|'|x|pulg|x\d+)\b/gi, '')
                       .replace(/\s+-\s+.*$/, '') // anything after a hyphen
                       .replace(/\s*\(.*\)\s*/, '') // anything in parentheses
                       .replace(/\s+/g, ' ')
                       .trim();
                       
    // If we stripped too much, use the first 3 words
    if (baseName.length < 5) {
      baseName = name.split(' ').slice(0, 3).join(' ').trim();
    }

    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(p);
  }

  // Filter groups with more than 1 item and less than 15 items to avoid huge generic groups
  const potentialVariants = Object.entries(groups)
    .filter(([baseName, items]) => items.length > 1 && items.length <= 15)
    .sort((a, b) => b[1].length - a[1].length);

  console.log('Found ' + potentialVariants.length + ' potential variant groups.\n');

  let count = 0;
  for (const [base, items] of potentialVariants) {
    if (count > 20) break; // show top 20
    console.log('--- Base Name: "' + base.toUpperCase() + '" (' + items.length + ' items) ---');
    for (const item of items) {
      console.log('  - ' + (item.sku || 'SIN-SKU').padEnd(12) + ' : ' + item.name + ' ($' + item.price + ')');
    }
    console.log('');
    count++;
  }
  
  await prisma.$disconnect();
}
main();
