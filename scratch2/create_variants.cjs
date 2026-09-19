const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_Bd38FNUIMSah@ep-winter-grass-b4d7zlkm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

function getVariantName(fullName, baseName) {
  let vName = fullName.toLowerCase().replace(baseName.toLowerCase(), '').trim();
  // Clean up leading hyphen or dash
  vName = vName.replace(/^[-:/,]+/, '').trim();
  if (vName.length === 0) return 'Estándar';
  
  // Capitalize first letter
  return vName.charAt(0).toUpperCase() + vName.slice(1);
}

// Convert string like "TIRADOR DE PLÁSTICO" to "Tirador De Plástico" for the base product name
function toTitleCase(str) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, sku: true, price: true, comparePrice: true, stock: true }
  });

  const groups = {};

  for (const p of products) {
    let name = p.name.trim().toLowerCase();
    name = name.replace(/\s+/g, ' ');
    let baseName = name;
    
    // Pattern 1: Strip trailing sizes and colors, or anything after a hyphen
    baseName = baseName.replace(/\b(blanco|negra|negro|roja|rojo|azul|verde|amarillo|gris|marron|marrón|transparente|natural)\b/gi, '')
                       .replace(/\b\d+(\.\d+)?\s*(mm|cm|m|kg|g|l|ml|pulgadas|"|'|x|pulg|x\d+)\b/gi, '')
                       .replace(/\s+-\s+.*$/, '')
                       .replace(/\s*\(.*\)\s*/, '')
                       .replace(/\s+/g, ' ')
                       .trim();
                       
    if (baseName.length < 5) {
      baseName = name.split(' ').slice(0, 3).join(' ').trim();
    }

    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(p);
  }

  const potentialVariants = Object.entries(groups)
    .filter(([baseName, items]) => items.length > 1 && items.length <= 15)
    .sort((a, b) => b[1].length - a[1].length);

  let updatedGroups = 0;
  let deletedProducts = 0;

  for (const [base, items] of potentialVariants) {
    if (items.length < 2) continue;

    // 1. Pick the first one as the base product
    const baseProduct = items[0];
    const newBaseName = toTitleCase(base);

    console.log(`\n=== Procesando Grupo: ${newBaseName} ===`);
    
    // 2. Rename the base product
    await prisma.product.update({
      where: { id: baseProduct.id },
      data: { name: newBaseName }
    });

    // 3. Create variants for all items (including the base product itself)
    for (const item of items) {
      const variantName = getVariantName(item.name, base);
      
      console.log(`  -> Creando variante: ${variantName} (SKU: ${item.sku}) Precio: $${item.price}`);
      
      // Upsert variant so we don't duplicate if we run this twice
      await prisma.productVariant.upsert({
        where: { sku: item.sku || ('VAR-' + item.id) },
        update: {
          name: variantName,
          price: item.price,
          comparePrice: item.comparePrice,
          stock: item.stock
        },
        create: {
          productId: baseProduct.id,
          name: variantName,
          sku: item.sku || ('VAR-' + item.id),
          price: item.price,
          comparePrice: item.comparePrice,
          stock: item.stock,
          active: true
        }
      });

      // 4. If this is NOT the base product, delete the original product record
      if (item.id !== baseProduct.id) {
        // Delete original product
        await prisma.product.delete({
          where: { id: item.id }
        });
        deletedProducts++;
      }
    }
    
    updatedGroups++;
  }

  console.log(`\nListo! Se crearon variantes para ${updatedGroups} productos base.`);
  console.log(`Se eliminaron ${deletedProducts} productos individuales sobrantes (fueron convertidos en variantes).`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
