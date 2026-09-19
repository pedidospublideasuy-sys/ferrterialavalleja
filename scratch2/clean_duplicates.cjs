const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const notebooksCat = await prisma.category.findFirst({ where: { name: 'Notebooks' } });
  if (!notebooksCat) return console.log("No Notebooks category");

  const duplicates = await prisma.product.findMany({
    where: { categoryId: notebooksCat.id }
  });

  console.log(`Found ${duplicates.length} products in Notebooks`);

  // We can delete them because they are the bad duplicates I just created.
  // Let's verify they were created recently.
  let recentCount = 0;
  for (const d of duplicates) {
    if (d.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 2)) {
      recentCount++;
    }
  }
  console.log(`Of those, ${recentCount} were created in the last 2 hours.`);
  
  if (recentCount > 0) {
    const res = await prisma.product.deleteMany({
      where: {
        categoryId: notebooksCat.id,
        createdAt: { gt: new Date(Date.now() - 1000 * 60 * 60 * 2) }
      }
    });
    console.log(`Deleted ${res.count} products.`);
  }
}

main().finally(() => prisma.$disconnect());
