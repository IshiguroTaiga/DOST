const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Evacuation_Template.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  for (let r = 2; r < 8; r++) {
    console.log(`Row ${r + 1}:`);
    for (let c = 9; c <= 25; c++) {
      console.log(`  Col ${c}: ${data[r][c] || ''}`);
    }
  }
} catch (e) {
  console.error('Error reading headers:', e);
}
