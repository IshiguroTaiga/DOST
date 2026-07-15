const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Region 1 Inventory of Evacuation Centers as of February 2025.xlsx');
console.log('Reading:', filePath);
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
  if (sheetName.toLowerCase().includes('instruction')) return;
  const sheet = workbook.Sheets[sheetName];
  if (!sheet['!ref']) return;
  const range = XLSX.utils.decode_range(sheet['!ref']);
  console.log(`\nSheet: ${sheetName}, cols: ${range.e.c + 1}`);
  
  for (let r = 0; r < Math.min(6, range.e.r + 1); r++) {
    const rowCells = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      rowCells.push(cell ? cell.v : '');
    }
    console.log(`Row ${r}:`, rowCells);
  }
});
