const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const prisma = new PrismaClient();

async function main() {
  console.log("Cargando lista de variables antigua...");
  const oldWebText = fs.readFileSync('scratch2/woo_variables_list.txt', 'utf8');
  let oldList = oldWebText.split('\n').map(l => l.trim()).filter(l => l && l !== 'post_title');
  // Remove duplicates
  oldList = [...new Set(oldList)];
  oldList.sort();

  console.log("Cargando lista de variables nueva...");
  const newProducts = await prisma.product.findMany({
    where: {
      variants: { some: {} }
    },
    select: { name: true, sku: true },
    orderBy: { name: 'asc' }
  });

  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Reporte de Productos Variables', 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Total en Web Vieja: ${oldList.length}`, 14, 30);
  doc.text(`Total en Web Nueva: ${newProducts.length}`, 14, 37);

  const autoTable = require('jspdf-autotable').default;

  // Table for New Web
  autoTable(doc, {
    startY: 45,
    head: [['Nombre (Web Nueva)', 'SKU']],
    body: newProducts.map(p => [p.name, p.sku || 'N/A']),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] }
  });

  // Table for Old Web
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    head: [['Nombre (Web Vieja)']],
    body: oldList.map(name => [name]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [192, 57, 43] }
  });

  const pdfPath = 'public/productos_variables.pdf';
  fs.writeFileSync(pdfPath, doc.output());
  console.log(`PDF generado en: ${pdfPath}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
