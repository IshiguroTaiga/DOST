const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Evacuation_Template.xlsx');
try {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  const row4 = data[3] || [];
  row4.forEach((val, c) => {
    if (val !== undefined && val !== '') {
      console.log(`Col ${xlsx.utils.encode_col(c)} (index ${c}): ${val}`);
    }
  });
} catch (e) {
  console.error(e);
}
