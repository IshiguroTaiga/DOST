const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Evacuation_Template.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  data.forEach((row, i) => {
    const rowStr = JSON.stringify(row);
    if (rowStr.includes('Bacnotan') || rowStr.includes('Baroro') || rowStr.includes('Guinabang')) {
      console.log(`Row ${i + 1} (0-indexed ${i}):`);
      row.forEach((cell, colIdx) => {
        if (cell !== undefined && cell !== null && cell !== '') {
          console.log(`  Col ${colIdx}: ${cell}`);
        }
      });
    }
  });
} catch (e) {
  console.error('Error searching:', e);
}
