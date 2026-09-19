const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const targets = [
  {
    name: 'Ménsula Escuadra Hierro Reforzada - Para Estantes',
    variants: ['20x12 cm', '25x16 cm', '30x19 cm', '40x25 cm']
  },
  {
    name: 'Disco soporte lija velcro 4 1/2 con adaptador',
    variants: ['P60', 'P80', 'P120', 'P240', 'P320']
  },
  {
    name: 'PINTURA EN AEROSOL PENSSYLVANIA',
    variants: ['Blanco', 'Negro', 'Plata', 'Amarillo', 'Rojo Brillante', 'Azul', 'Blanco Mate', 'Negro Mate', 'Marrón', 'Verde', 'Gris Naval', 'Lacquer', 'Oro']
  },
  {
    name: 'Barra de silicona caliente diferentes colores 11,2x300mm',
    variants: ['Bordo', 'Verde', 'Amarillo', 'Blanco', 'Rosado', 'Azul']
  }
];

async function main() {
  for (const t of targets) {
    const p = await prisma.product.findFirst({
      where: { name: t.name }
    });
    
    if (!p) {
      console.log(`NO ENCONTRADO: ${t.name}`);
      continue;
    }
    
    // Borrar variantes actuales si las hubiera
    await prisma.productVariant.deleteMany({
      where: { productId: p.id }
    });
    
    // Crear las nuevas
    for (const vName of t.variants) {
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          name: vName,
          price: p.price,
          stock: 100, // o lo que tenga el producto? mejor 100
          active: true,
          attributes: '{}'
        }
      });
    }
    console.log(`CREADO: ${t.variants.length} variantes para ${t.name}`);
  }
}

main().finally(() => prisma.$disconnect());
