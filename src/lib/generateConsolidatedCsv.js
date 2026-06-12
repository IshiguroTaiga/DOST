import { zipSync, strToU8 } from 'fflate';

/**
 * Generate a Consolidated Report as a ZIP file containing separate CSVs for each category.
 * Each CSV follows the structure of the templates provided in the /CSV directory.
 */
export function generateConsolidatedCsv({
    eventName,
    province,
    cities = [],
    categoryTotals = {},
    byCityCategory = {},
    relatedIncidentsDetails = [],
    affectedPopulationDetails = [],
    roadsAndBridgesDetails = [],
    powerDetails = [],
    waterSupplyDetails = [],
    communicationLinesDetails = [],
    damagedHousesDetails = [],
    classSuspensionDetails = [],
    workSuspensionDetails = [],
    stateOfCalamityDetails = [],
    preEmptiveEvacuationDetails = [],
    assistanceProvidedDetails = [],
    assistanceLgusDetails = [],
    agricultureDamageDetails = [],
    infrastructureDamageDetails = [],
    summaryText = '',
    signatories = {},
}) {
    const files = {};
    // Removed 'Region 1' fallback as requested
    const provinceName = province || '';

    // Helper: escape CSV cell value
    const esc = (v) => {
        const s = String(v ?? '').replace(/\r?\n/g, ' ');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    // Helper: format date as m/d/Y
    const formatDate = (v) => {
        if (!v) return '';
        const d = new Date(v);
        if (isNaN(d.getTime())) return String(v);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    };

    // Helper: format time as 24:00 (HH:mm)
    const formatTime = (v) => {
        if (!v) return '';
        const s = String(v);
        if (s.includes(':')) {
            const parts = s.split(':');
            return `${parts[0]}:${parts[1] || '00'}`;
        }
        return s;
    };

    const n = (v) => {
        if (typeof v === 'number') return v;
        if (!v) return 0;
        const parsed = Number(String(v).replace(/,/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    const createCsv = (headers, rows) => {
        const content = [
            headers.map(esc).join(','),
            ...rows.map(row => row.map(esc).join(','))
        ].join('\r\n');
        return strToU8('\uFEFF' + content); // Add BOM
    };

    // 1. DISASTER MONITORING.csv
    {
        const overviewRows = [[
            eventName || '',
            summaryText || '',
            '', 
            ''  
        ]];
        files['DISASTER MONITORING.csv'] = createCsv(['EVENT', 'OVERVIEW', 'DATE FROM', 'DATE ENDED'], overviewRows);
    }

    // 1.5 Related Incidents
    if (relatedIncidentsDetails) {
        const riHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE OF INCIDENT', 'DATE OF OCCURRENCE [m/d/Y]', 'TIME OF OCCURRENCE [24:00]', 'DESCRIPTION', 'ACTIONS TAKEN', 'STATUS', 'REMARKS'];
        const riRows = relatedIncidentsDetails.map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE OF INCIDENT'] || r.type_of_incident || r.type || '',
            formatDate(r['DATE OF OCCURRENCE [m/d/Y]'] || r.date_of_occurrence || r.date),
            formatTime(r['TIME OF OCCURRENCE [24:00]'] || r.time_of_occurrence || r.time),
            r['DESCRIPTION'] || r.description || '',
            r['ACTIONS TAKEN'] || r.actions_taken || '',
            r['STATUS'] || r.status || '',
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Related Incidents-Template.csv'] = createCsv(riHeaders, riRows);
    }

    // 2. Roads and Bridges
    if (roadsAndBridgesDetails) {
        const rbHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE', 'CLASSIFICATION', 'ROAD SECTION/BRIDGE', 'STATUS', 'DATE PASSABLE [m/d/Y]', 'TIME PASSABLE [24:00]', 'DATE NOT PASSABLE [m/d/Y]', 'TIME NOT PASSABLE [24:00]', 'REMARKS'];
        const rbRows = (roadsAndBridgesDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE'] || r.type || '',
            r['CLASSIFICATION'] || r.classification || '',
            r['ROAD SECTION/BRIDGE'] || r.road_bridge_name || r.road_section_bridge || r.road_section || r.name || '',
            r['STATUS'] || r.status || '',
            formatDate(r['DATE PASSABLE [m/d/Y]'] || r.date_passable || r.date_reported_passable),
            formatTime(r['TIME PASSABLE [24:00]'] || r.time_passable || r.time_reported_passable),
            formatDate(r['DATE NOT PASSABLE [m/d/Y]'] || r.date_not_passable || r.date_reported_not_passable),
            formatTime(r['TIME NOT PASSABLE [24:00]'] || r.time_not_passable || r.time_reported_not_passable),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Roads and Bridges-Template.csv'] = createCsv(rbHeaders, rbRows);
    }

    // 3. Power
    if (powerDetails) {
        const powerHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE', 'SERVICE PROVIDER', 'DATE OF INTERRUPTION/ OUTAGE [m/d/Y]', 'TIME OF INTERRUPTION/ OUTAGE [24:00]', 'DATE RESTORED [m/d/Y]', 'TIME RESTORED [24:00]', 'REMARKS'];
        const powerRows = (powerDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE'] || r.type || 'Interruption',
            r['SERVICE PROVIDER'] || r.service_provider || '',
            formatDate(r['DATE OF INTERRUPTION/ OUTAGE [m/d/Y]'] || r.date_interruption || r.date_of_interruption),
            formatTime(r['TIME OF INTERRUPTION/ OUTAGE [24:00]'] || r.time_interruption || r.time_of_interruption),
            formatDate(r['DATE RESTORED [m/d/Y]'] || r.date_restored),
            formatTime(r['TIME RESTORED [24:00]'] || r.time_restored),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Power-Template.csv'] = createCsv(powerHeaders, powerRows);
    }

    // 4. Water Supply
    if (waterSupplyDetails) {
        const waterHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE', 'SERVICE PROVIDER', 'DATE OF INTERRUPTION/ OUTAGE [m/d/Y]', 'TIME OF INTERRUPTION/ OUTAGE [24:00]', 'DATE RESTORED', 'TIME RESTORED', 'REMARKS'];
        const waterRows = (waterSupplyDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE'] || r.type || '',
            r['SERVICE PROVIDER'] || r.service_provider || '',
            formatDate(r['DATE OF INTERRUPTION/ OUTAGE [m/d/Y]'] || r.date_interruption),
            formatTime(r['TIME OF INTERRUPTION/ OUTAGE [24:00]'] || r.time_interruption),
            formatDate(r['DATE RESTORED'] || r.date_restored),
            formatTime(r['TIME RESTORED'] || r.time_restored),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Water Supply-Template.csv'] = createCsv(waterHeaders, waterRows);
    }

    // 5. Communication Lines
    if (communicationLinesDetails) {
        const commHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TELECOMPANY', 'STATUS OF COMMUNICATION', 'DATE INTERRUPTION [m/d/Y]', 'TIME INTERRUPTION [24:00]', 'DATE RESTORATION [m/d/Y]', 'TIME RESTORATION [24:00]', '2G SITE COUNT', '2G WITH COVERAGE', '2G % OF COVERAGE', '3G SITE COUNT', '3G WITH COVERAGE', '3G % OF COVERAGE', '4G SITE COUNT', '4G WITH COVERAGE', '4G % OF COVERAGE', 'REMARKS'];
        const commRows = (communicationLinesDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TELECOMPANY'] || r.telecompany || '',
            r['STATUS OF COMMUNICATION'] || r.status_of_communication || r.status || '',
            formatDate(r['DATE INTERRUPTION [m/d/Y]'] || r.date_interruption),
            formatTime(r['TIME INTERRUPTION [24:00]'] || r.time_interruption),
            formatDate(r['DATE RESTORATION [m/d/Y]'] || r.date_restoration || r.date_restored),
            formatTime(r['TIME RESTORATION [24:00]'] || r.time_restoration || r.time_restored),
            r['2G SITE COUNT'] || r.site_count_2g || '', 
            r['2G WITH COVERAGE'] || r.with_coverage_2g || '', 
            r['2G % OF COVERAGE'] || r.pct_coverage_2g || '',
            r['3G SITE COUNT'] || r.site_count_3g || '', 
            r['3G WITH COVERAGE'] || r.with_coverage_3g || '', 
            r['3G % OF COVERAGE'] || r.pct_coverage_3g || '',
            r['4G SITE COUNT'] || r.site_count_4g || '', 
            r['4G WITH COVERAGE'] || r.with_coverage_4g || '', 
            r['4G % OF COVERAGE'] || r.pct_coverage_4g || '',
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Communication Lines-Template.csv'] = createCsv(commHeaders, commRows);
    }

    // 6. Damaged Houses
    if (damagedHousesDetails) {
        const houseHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TOTALLY [number]', 'PARTIALLY [number]', 'GRAND TOTAL [number]', 'AMOUNT [number]', 'REMARKS'];
        const houseRows = (damagedHousesDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            n(r['TOTALLY [number]'] ?? r.totally_damaged),
            n(r['PARTIALLY [number]'] ?? r.partially_damaged),
            n(r['TOTALLY [number]'] ?? r.totally_damaged) + n(r['PARTIALLY [number]'] ?? r.partially_damaged),
            n(r['AMOUNT [number]'] ?? (r.amount_php ?? r.amount)),
            r['REMARKS'] || r.remarks || ''
        ]);
        const houseContent = [
            ',,,"NO. OF DAMAGED HOUSES",,,,',
            houseHeaders.map(esc).join(','),
            ...houseRows.map(row => row.map(esc).join(','))
        ].join('\r\n');
        files['Damaged Houses-Template.csv'] = strToU8('\uFEFF' + houseContent);
    }

    // 7. Class Suspension
    if (classSuspensionDetails) {
        const classHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'LEVEL FROM', 'LEVEL TO', 'TYPE', 'DATE OF SUSPENSION [m/d/Y]', 'TIME OF SUSPENSION [24:00]', 'DATE RESUMED [m/d/Y]', 'TIME RESUMED [24:00]', 'REMARKS'];
        const classRows = (classSuspensionDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['LEVEL FROM'] || r.level_from || '',
            r['LEVEL TO'] || r.level_to || '',
            r['TYPE'] || r.type || '',
            formatDate(r['DATE OF SUSPENSION [m/d/Y]'] || r.date_of_suspension),
            formatTime(r['TIME OF SUSPENSION [24:00]'] || r.time_of_suspension),
            formatDate(r['DATE RESUMED [m/d/Y]'] || r.date_resumed),
            formatTime(r['TIME RESUMED [24:00]'] || r.time_resumed),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Class Suspension-Template.csv'] = createCsv(classHeaders, classRows);
    }

    // 8. Work Suspension
    if (workSuspensionDetails) {
        const workHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE', 'DATE OF SUSPENSION [m/d/Y]', 'TIME OF SUSPENSION [24:00]', 'DATE RESUMED [m/d/Y]', 'TIME RESUMED [24:00]', 'REMARKS'];
        const workRows = (workSuspensionDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE'] || r.type || '',
            formatDate(r['DATE OF SUSPENSION [m/d/Y]'] || r.date_of_suspension),
            formatTime(r['TIME OF SUSPENSION [24:00]'] || r.time_of_suspension),
            formatDate(r['DATE RESUMED [m/d/Y]'] || r.date_resumed),
            formatTime(r['TIME RESUMED [24:00]'] || r.time_resumed),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Work Suspension-Template.csv'] = createCsv(workHeaders, workRows);
    }

    // 9. Damage and Losses to Agriculture
    if (agricultureDamageDetails) {
        const agriHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'CLASSIFICATION', 'TYPE', 'NO. OF FARMERS/ FISHERFOLK AFFECTED [number]', 'WITH NO CHANCE OF RECOVERY (TOTALLY DAMAGED) [number]', 'WITH CHANCE OF RECOVERY (PARTIALLY DAMAGED) [number]', 'TOTAL [number]', 'TOTALLY DAMAGED [number]', 'PARTIALLY DAMAGED [number]', 'TOTAL [number]', 'PRODUCTION LOSS IN VOLUME (MT) [number]', 'PRODUCTION LOSS / COST OF DAMAGE IN VALUE (PHP) [number]'];
        const agriRows = (agricultureDamageDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['CLASSIFICATION'] || r.classification || '',
            r['TYPE'] || r.commodity_type || r.type || '',
            n(r['NO. OF FARMERS/ FISHERFOLK AFFECTED [number]'] ?? r.farmers_affected),
            n(r['WITH NO CHANCE OF RECOVERY (TOTALLY DAMAGED) [number]'] ?? (r.area_totally_damaged || r.area_totally)),
            n(r['WITH CHANCE OF RECOVERY (PARTIALLY DAMAGED) [number]'] ?? (r.area_partially_damaged || r.area_partially)),
            n(r['TOTAL [number]'] ?? (r.area_total || (n(r.area_totally || r.area_totally_damaged) + n(r.area_partially || r.area_partially_damaged)))),
            n(r['TOTALLY DAMAGED [number]'] ?? (r.infra_totally_damaged || r.infra_totally)),
            n(r['PARTIALLY DAMAGED [number]'] ?? (r.infra_partially_damaged || r.infra_partially)),
            n(r['TOTAL [number]_1'] ?? (r.infra_total || (n(r.infra_totally || r.infra_totally_damaged) + n(r.infra_partially || r.infra_partially_damaged)))),
            n(r['PRODUCTION LOSS IN VOLUME (MT) [number]'] ?? (r.production_loss_volume || r.volume_loss)),
            n(r['PRODUCTION LOSS / COST OF DAMAGE IN VALUE (PHP) [number]'] ?? (r.value_loss || r.production_loss_value))
        ]);
        const agriContent = [
            ',,,,,,"AFFECTED CROP AREA (HA)",,,"NUMBER OF DAMAGED INFRASTRUCTURE, MACHINERIES, EQUIPMENT",,,,',
            agriHeaders.map(esc).join(','),
            ...agriRows.map(row => row.map(esc).join(','))
        ].join('\r\n');
        files['Damage and Losses to Agriculture-Template.csv'] = strToU8('\uFEFF' + agriContent);
    }

    // 10. Damage to Infrastructure
    if (infrastructureDamageDetails) {
        const infraHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE', 'CLASSIFICATION', 'INFRASTRUCTURE', 'NUMBER OF DAMAGED', 'UNIT', 'QUANTITY [number]', 'STATUS', 'COST(PHP) [number]', 'REMARKS'];
        const infraRows = (infrastructureDamageDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE'] || r.infra_type || r.type || '',
            r['CLASSIFICATION'] || r.classification || '',
            r['INFRASTRUCTURE'] || r.infrastructure_name || r.infrastructure || '',
            n(r['NUMBER OF DAMAGED'] ?? (r.number_of_damaged || 1)),
            r['UNIT'] || r.unit || '',
            n(r['QUANTITY [number]'] ?? r.quantity),
            r['STATUS'] || r.status || '',
            n(r['COST(PHP) [number]'] ?? (r.cost || r.estimated_cost)),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Damage to Infrastructure-Template.csv'] = createCsv(infraHeaders, infraRows);
    }

    // 11. Pre-emptive Evacuation
    if (preEmptiveEvacuationDetails) {
        const peHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'FAMILIES [number]', 'MALE [number]', 'FEMALE [number]', 'TOTAL (Note: If the available data is "Total Persons", please input/encode in this column) [number]', 'REMARKS'];
        const peRows = (preEmptiveEvacuationDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            n(r['FAMILIES [number]'] ?? r.families),
            n(r['MALE [number]'] ?? (r.male_count || 0)),
            n(r['FEMALE [number]'] ?? (r.female_count || 0)),
            n(r['TOTAL (Note: If the available data is "Total Persons", please input/encode in this column) [number]'] ?? (r.persons || r.total || (n(r.families) * 5))),
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Pre-emptive Evacuation-Template.csv'] = createCsv(peHeaders, peRows);
    }

    // 12. Assistance Provided to Affected Families
    if (assistanceProvidedDetails) {
        const assistHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'NO. OF FAMILIES AFFECTED [number]', 'NEEDS', 'NO. OF FAMILIES REQUIRING ASSISTANCE [number]', 'QTY [number]', 'UNIT', 'COST PER UNIT [number]', 'AMOUNT [number]', 'SOURCE', 'NO. OF FAMILIES ASSISTED [number]', '% OF FAMILIES ASSISTED [number]', 'REMARKS'];
        const assistRows = (assistanceProvidedDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            n(r['NO. OF FAMILIES AFFECTED [number]'] ?? r.no_families_affected),
            r['NEEDS'] || r.needs || '',
            n(r['NO. OF FAMILIES REQUIRING ASSISTANCE [number]'] ?? r.no_families_requiring_assistance),
            n(r['QTY [number]'] ?? (r.qty || r.quantity)),
            r['UNIT'] || r.unit || '',
            n(r['COST PER UNIT [number]'] ?? (r.cost_per_unit || r.costPerUnit)),
            n(r['AMOUNT [number]'] ?? (r.amount || r.fnfi_amount)),
            r['SOURCE'] || r.source || '',
            n(r['NO. OF FAMILIES ASSISTED [number]'] ?? r.no_families_assisted),
            n(r['% OF FAMILIES ASSISTED [number]'] ?? r.pct_families_assisted),
            r['REMARKS'] || r.remarks || ''
        ]);
        const assistContent = [
            ',,,,,,"F/NFIs PROVIDED",,,,,,,',
            assistHeaders.map(esc).join(','),
            ...assistRows.map(row => row.map(esc).join(','))
        ].join('\r\n');
        files['Assistance Provided to Affected Families-Template.csv'] = strToU8('\uFEFF' + assistContent);
    }

    // 13. Assistance Provided to LGUs and Regional Agencies
    if (assistanceLgusDetails) {
        const assistLguHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'SOURCE', 'TYPE', 'QTY [number]', 'UNIT', 'COST PER UNIT [number]', 'AMOUNT [number]', 'STATUS', 'REMARKS'];
        const assistLguRows = (assistanceLgusDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['SOURCE'] || r.source || '',
            r['TYPE'] || r.type || '',
            n(r['QTY [number]'] ?? r.qty),
            r['UNIT'] || r.unit || '',
            n(r['COST PER UNIT [number]'] ?? (r.cost_per_unit || r.costPerUnit)),
            n(r['AMOUNT [number]'] ?? r.amount),
            r['STATUS'] || r.status || 'Ongoing',
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Assistance Provided to LGUs and Regional Agencies-Template.csv'] = createCsv(assistLguHeaders, assistLguRows);
    }

    // 14. Declaration of State of Calamity
    if (stateOfCalamityDetails) {
        const socHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'TYPE', 'COUNT [number]', 'RESOLUTION NO', 'RESOLUTION DATE [m/d/Y]', 'STATUS', 'REMARKS'];
        const socRows = (stateOfCalamityDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            r['TYPE'] || r.type || '',
            n(r['COUNT [number]'] ?? (r.count_soc || r.countSoc)),
            r['RESOLUTION NO'] || r.resolution_number || r.resolutionNo || '',
            formatDate(r['RESOLUTION DATE [m/d/Y]'] || r.resolution_date || r.resolutionDate),
            r['STATUS'] || r.status || 'Declared',
            r['REMARKS'] || r.remarks || ''
        ]);
        files['Declaration of State of Calamity-Template.csv'] = createCsv(socHeaders, socRows);
    }

    // 15. Affected Population
    if (affectedPopulationDetails) {
        const apHeaders = ['PROVINCE', 'CITY/ MUNICIPALITY', 'BARANGAY', 'Families [number]', 'Persons [number]', 'CUM [number]', 'NOW [number]', 'Fam. CUM [number]', 'Fam. NOW [number]', 'Per. CUM [number]', 'Per. NOW [number]', 'Fam. CUM [number]', 'Fam. NOW [number]', 'Per. CUM [number]', 'Per. NOW [number]', 'Remarks'];
        const apRows = (affectedPopulationDetails || []).map(r => [
            r['PROVINCE'] || provinceName,
            r['CITY/ MUNICIPALITY'] || r.city || '',
            r['BARANGAY'] || r.barangay || '',
            n(r['Families [number]'] ?? (r.affected_families ?? r.families)),
            n(r['Persons [number]'] ?? (r.affected_persons ?? r.persons)),
            n(r['CUM [number]'] ?? r.ecs_cum),
            n(r['NOW [number]'] ?? r.ecs_now),
            n(r['Fam. CUM [number]'] ?? r.inside_families_cum),
            n(r['Fam. NOW [number]'] ?? r.inside_families_now),
            n(r['Per. CUM [number]'] ?? r.inside_persons_cum),
            n(r['Per. NOW [number]'] ?? r.inside_persons_now),
            n(r['Fam. CUM [number]_1'] ?? r.outside_families_cum),
            n(r['Fam. NOW [number]_1'] ?? r.outside_families_now),
            n(r['Per. CUM [number]_1'] ?? r.outside_persons_cum),
            n(r['Per. NOW [number]_1'] ?? r.outside_persons_now),
            r['Remarks'] || r.remarks || ''
        ]);
        const apContent = [
            ',,,NO. OF AFFECTED,,NO. OF ECs,,INSIDE EVACUATION CENTERS,,,,OUTSIDE EVACUATION CENTERS,,,,',
            apHeaders.map(esc).join(','),
            ...apRows.map(row => row.map(esc).join(','))
        ].join('\r\n');
        files['Affected Population-Template.csv'] = strToU8('\uFEFF' + apContent);
    }

    // Create the ZIP
    const zipped = zipSync(files);
    const blob = new Blob([zipped], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consolidated_Report_${(eventName || 'Event').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ───────── Helpers ─────────

function groupByCity(details) {
    const byCity = {};
    details.forEach(r => {
        const city = r.city || 'Unknown';
        if (!byCity[city]) byCity[city] = [];
        byCity[city].push(r);
    });
    return byCity;
}

function formatCategoryLabel(cat) {
    const CATEGORY_LABELS = {
        relatedIncidents: 'Related Incidents',
        affectedPopulation: 'Affected Population',
        roadsAndBridges: 'Roads and Bridges',
        power: 'Power',
        waterSupply: 'Water Supply',
        communicationLines: 'Communication Lines',
        damagedHouses: 'Damaged Houses',
        classSuspension: 'Class Suspension',
        workSuspension: 'Work Suspension',
        stateOfCalamity: 'Declaration of State of Calamity',
        preEmptiveEvacuation: 'Pre-emptive Evacuation',
        assistanceProvided: 'Assistance Provided',
        assistanceLgus: 'Assistance from LGUs/Agencies',
        agricultureDamage: 'Agriculture Damage',
        infrastructureDamage: 'Infrastructure Damage',
    };
    return CATEGORY_LABELS[cat] || cat;
}
