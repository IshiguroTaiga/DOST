const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Evacuation_Template.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  console.log('Sheets in workbook:', workbook.SheetNames);
  
  // Read first sheet
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  
  // Convert sheet to json with headers
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log('Total rows:', data.length);
  console.log('First 25 rows:');
  data.slice(0, 25).forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row.slice(0, 20));
  });
} catch (e) {
  console.error('Error reading xlsx:', e);
}
