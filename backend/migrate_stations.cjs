/**
 * migrate_stations.cjs
 * 
 * Migration script to import monitoring station inventory from Excel to PostgreSQL.
 */

const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const EXCEL_PATH = path.join(__dirname, '../InteractiveMap/Inventory-of-Monitoring-and-Warning-Stations-in-Region-1.xlsx');

/**
 * Extracts lat/lng from a string by searching for numbers and identifying which is which.
 */
function extractLatLng(coordStr) {
  if (!coordStr || coordStr === '...' || coordStr === 'N/A') return { lat: null, lng: null };

  const s = String(coordStr).trim();
  
  // Extract all numeric values (including decimals)
  const allNums = s.match(/[-+]?[\d.]+/g);
  if (!allNums || allNums.length < 2) return { lat: null, lng: null };

  const vals = allNums.map(Number);

  let lat = null, lng = null;

  // Case 1: 6 numbers (D M S D M S)
  if (vals.length >= 6) {
    lat = vals[0] + vals[1]/60 + vals[2]/3600;
    lng = vals[3] + vals[4]/60 + vals[5]/3600;
  }
  // Case 2: 4 numbers (D M D M)
  else if (vals.length >= 4) {
    lat = vals[0] + vals[1]/60;
    lng = vals[2] + vals[3]/60;
  }
  // Case 3: 2 numbers (Decimal)
  else if (vals.length >= 2) {
    lat = vals[0];
    lng = vals[1];
  }

  if (lat !== null && lng !== null) {
    // In PH, Longitude is always > 100
    if (lat > 100 && lng < 100) {
      [lat, lng] = [lng, lat];
    }
    return { lat, lng };
  }

  return { lat: null, lng: null };
}

async function migrate() {
  console.log('🚀 Starting Precision Monitoring Stations Migration...');
  
  try {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM monitoring_stations');

      for (const sheetName of workbook.SheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const rows = data.slice(1);

        for (const row of rows) {
          let lguName = row[5];
          if (!lguName || ['dfd', 'Dd', 'wertyui', 'S'].includes(lguName.trim())) continue;

          // Determine Province based on LGU Name OR Address or SheetName
          let province = sheetName;
          const fullText = (lguName + ' ' + (row[6] || '')).toLowerCase();
          
          if (fullText.includes('ilocos norte') || fullText.includes('vin┬átar') || fullText.includes('dingras') || fullText.includes('solsona') || fullText.includes('adams')) {
            province = 'Ilocos Norte';
          } else if (fullText.includes('ilocos sur') || fullText.includes('suyo') || fullText.includes('bantay') || fullText.includes('santiago') || fullText.includes('burgos') || fullText.includes('caoayan')) {
            province = 'Ilocos Sur';
          } else if (fullText.includes('pangasinan') || fullText.includes('umingan') || fullText.includes('pozorrubio') || fullText.includes('san fabian') || fullText.includes('san jacinto') || fullText.includes('bolinao') || fullText.includes('anda') || fullText.includes('alaminos') || fullText.includes('tayug') || fullText.includes('san quintin') || fullText.includes('bugallon') || fullText.includes('aguilar') || fullText.includes('alcala')) {
            province = 'Pangasinan';
          } else if (fullText.includes('la union') || fullText.includes('bangar') || fullText.includes('balaoan') || fullText.includes('santol') || fullText.includes('santo tomas') || fullText.includes('san fernando')) {
            province = 'La Union';
          }

          // Priority for coordinates
          const coordOptions = [
            row[15],  // AWS Coords
            row[31],  // ARG Coords
            row[47],  // WLMS Coords
            row[63],  // PEIMNET Coords
            row[79],  // CTAS Coords
            row[98],  // Alerting Coords
            row[113], // SLMS Coords
            row[7]    // Office Coords
          ];
          
          let finalLat = null, finalLng = null;

          for (const opt of coordOptions) {
            const { lat, lng } = extractLatLng(opt);
            // Validate: Must be in or near Region 1
            if (lat && lng && lat > 15 && lat < 19 && lng > 119 && lng < 122) {
              finalLat = lat;
              finalLng = lng;
              break;
            }
          }

          // Manual Fixes
          if (lguName.includes('LGU DOST') || lguName.includes('San Fernando City')) {
             finalLat = 16.6159; finalLng = 120.3159; province = 'La Union';
          }

          if (!finalLat || !finalLng) {
            console.warn(`⚠️ No valid coordinates found for ${lguName}`);
            continue;
          }

          const equipment = {
            aws: row[10] === 'YES' ? { brand: row[11], model: row[12], coverage: row[14], coords: row[15] } : null,
            arg: row[26] === 'YES' ? { brand: row[27], model: row[28], coverage: row[30], coords: row[31] } : null,
            wlms: row[42] === 'YES' ? { brand: row[43], model: row[44], coverage: row[46], coords: row[47] } : null,
            peimnet: row[58] === 'YES' ? { brand: row[59], model: row[60], coverage: row[62], coords: row[63] } : null,
            ctas: row[74] === 'YES' ? { brand: row[75], model: row[76], coverage: row[78], coords: row[79] } : null,
            alerting: row[90] === 'YES' ? { name: row[91], brand: row[92], model: row[93], coords: row[98] } : null,
            slms: row[106] === 'YES' ? { brand: row[107], model: row[108], coverage: row[110], coords: row[113] } : null,
          };

          const query = `
            INSERT INTO monitoring_stations (province, lgu, address, latitude, longitude, equipment_details)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;
          
          await client.query(query, [
            province, 
            lguName.trim(), 
            row[6] || '', 
            finalLat, 
            finalLng, 
            JSON.stringify(equipment)
          ]);
        }
      }

      await client.query('COMMIT');
      console.log('✅ Precision migration completed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();