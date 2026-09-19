const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const notebooksCat = await prisma.category.findFirst({ where: { name: 'Notebooks' } });
  if (notebooksCat) {
    const products = await prisma.product.findMany({ where: { categoryId: notebooksCat.id } });
    console.log(`Products in Notebooks: ${products.length}`);
    products.forEach(p => console.log(p.name));
  }
}
main().finally(() => prisma.$disconnect());
