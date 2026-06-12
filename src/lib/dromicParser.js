/**
 * dromicParser.js
 * Utility to map DROMIC data to ProAct templates.
 */
import * as XLSX from 'xlsx';

/**
 * Helper to handle empty, NaN, or null values from DROMIC.
 */
const n = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    const num = Number(String(v).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

/**
 * Helper to handle string values.
 */
const s = (v) => String(v || '').trim();

/**
 * Maps DROMIC Annex D (Damaged Houses) to ProAct Damaged Houses format.
 * Matches exact template keys as requested.
 */
export function mapDromicDamagedHouses(dromicData) {
    if (!Array.isArray(dromicData)) return [];

    return dromicData
        .filter(item => {
            const regCode = s(item.Reg_Code_updated);
            return regCode !== '' && regCode.startsWith('PH');
        })
        .map(item => ({
            'PROVINCE': s(item.Pro_Name_updated),
            'CITY/ MUNICIPALITY': s(item.Mun_Name_updated),
            'BARANGAY': s(item.Brgy_Name_updated || ''),
            'TOTALLY [number]': n(item.Tot_DHous),
            'PARTIALLY [number]': n(item.Par_DHous),
            'AMOUNT [number]': n(item.Amount || 0),
            'REMARKS': s(item.Remarks || '')
        }));
}

/**
 * Maps DROMIC Annex A (Affected Population) to ProAct Affected Population format.
 * Matches exact template keys as requested.
 */
export function mapDromicAffectedPopulation(dromicData) {
    if (!Array.isArray(dromicData)) return [];

    return dromicData
        .filter(item => {
            const regCode = s(item.Reg_Code_updated);
            return regCode !== '' && regCode.startsWith('PH');
        })
        .map(item => ({
            'PROVINCE': s(item.Pro_Name_updated),
            'CITY/ MUNICIPALITY': s(item.Mun_Name_updated),
            'BARANGAY': s(item.Brgy_Name_updated || ''),
            'Families [number]': n(item.Aff_Fam),
            'Persons [number]': n(item.Aff_Per),
            // ProAct specific fields (initialized to 0)
            'CUM [number]': 0,
            'NOW [number]': 0,
            'Fam. CUM [number]': 0,
            'Fam. NOW [number]': 0,
            'Per. CUM [number]': 0,
            'Per. NOW [number]': 0,
            'Remarks': s(item.Remarks || '')
        }));
}

/**
 * Maps DROMIC Annex E (Cost of Assistance) to ProAct Assistance formats.
 */
export function mapDromicAssistance(dromicData) {
    if (!Array.isArray(dromicData)) return [];

    const assistanceProvided = [];
    
    dromicData
        .filter(item => {
            const regCode = s(item.Reg_Code_updated);
            return regCode !== '' && regCode.startsWith('PH');
        })
        .forEach(item => {
            const lguAmount = n(item.LGU || item.LGU_Cost);
            const dswdAmount = n(item.DSWD || item.DSWD_Cost);
            
            if (dswdAmount > 0) {
                assistanceProvided.push({
                    'PROVINCE': s(item.Pro_Name_updated),
                    'CITY/ MUNICIPALITY': s(item.Mun_Name_updated),
                    'BARANGAY': s(item.Brgy_Name_updated || ''),
                    'SOURCE': 'DSWD',
                    'AMOUNT [number]': dswdAmount,
                    'REMARKS': s(item.Remarks || '')
                });
            }
            
            if (lguAmount > 0) {
                assistanceProvided.push({
                    'PROVINCE': s(item.Pro_Name_updated),
                    'CITY/ MUNICIPALITY': s(item.Mun_Name_updated),
                    'BARANGAY': s(item.Brgy_Name_updated || ''),
                    'SOURCE': 'LGU',
                    'AMOUNT [number]': lguAmount,
                    'REMARKS': s(item.Remarks || '')
                });
            }
        });

    return assistanceProvided;
}

/**
 * Reads a DROMIC Excel file and parses its sheets.
 */
export async function parseDromicExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheets = { annexA: [], annexD: [], annexE: [] };

                workbook.SheetNames.forEach(name => {
                    const sheet = workbook.Sheets[name];
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 0 });
                    
                    const lowName = name.toLowerCase();
                    if (lowName.includes('annex a') || jsonData.some(r => r.Aff_Fam !== undefined)) {
                        sheets.annexA = jsonData;
                    } else if (lowName.includes('annex d') || jsonData.some(r => r.Tot_DHous !== undefined)) {
                        sheets.annexD = jsonData;
                    } else if (lowName.includes('annex e') || lowName.includes('assistance') || jsonData.some(r => r.DSWD !== undefined || r.LGU !== undefined)) {
                        sheets.annexE = jsonData;
                    }
                });
                resolve(sheets);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Returns a single, complete object containing arrays for ALL ProAct categories.
 */
export function transformDromicToProAct(dromicSheets) {
    return {
        affectedPopulationDetails: dromicSheets.annexA ? mapDromicAffectedPopulation(dromicSheets.annexA) : [],
        damagedHousesDetails: dromicSheets.annexD ? mapDromicDamagedHouses(dromicSheets.annexD) : [],
        assistanceProvidedDetails: dromicSheets.annexE ? mapDromicAssistance(dromicSheets.annexE) : [],
        
        relatedIncidentsDetails: [],
        roadsAndBridgesDetails: [],
        powerDetails: [],
        waterSupplyDetails: [],
        communicationLinesDetails: [],
        classSuspensionDetails: [],
        workSuspensionDetails: [],
        stateOfCalamityDetails: [],
        preEmptiveEvacuationDetails: [],
        assistanceLgusDetails: [],
        agricultureDamageDetails: [],
        infrastructureDamageDetails: [],
    };
}
