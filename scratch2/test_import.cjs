const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable');
console.log(typeof autoTable);
console.log(typeof autoTable.default);
const doc = new jsPDF();
console.log(typeof doc.autoTable);
