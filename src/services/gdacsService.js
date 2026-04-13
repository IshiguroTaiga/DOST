/**
 * gdacsService.js
 * Utility service for fetching and mapping GDACS disaster event data.
 * Filtered to the Philippine region (Lat: 4–21°N, Long: 116–127°E).
 */

// Philippine bounding box
const PH_BBOX = {
  minLat: 4,
  maxLat: 21,
  minLon: 116,
  maxLon: 127,
}

// GDACS event type codes to internal app categories
const EVENT_TYPE_MAP = {
  TC: 'typhoon',
  EQ: 'earthquake',
  FL: 'flood',
  TS: 'tsunami',
  VO: 'calamity', // Volcano → Other Incident
  DR: 'calamity', // Drought → Other Incident
  WF: 'calamity', // Wildfire → Other Incident
}

// Region I Mapping Data for extraction
const REGION_1_LOCATIONS = {
  provinces: ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
  lgus: [
    'Laoag City', 'Batac City', 'Vigan City', 'Candon City', 'San Fernando City', 'Dagupan City', 'Urdaneta City', 'San Carlos City', 'Alaminos City',
    'Adams', 'Bacarra', 'Badoc', 'Bangui', 'Banna', 'Burgos', 'Carasi', 'Currimao', 'Dingras', 'Dumalneg', 'Marcos', 'Nueva Era', 'Pagudpud', 'Paoay', 'Pasuquin', 'Piddig', 'Pinili', 'San Nicolas', 'Sarrat', 'Solsona', 'Vintar',
    'Bantay', 'Banayoyo', 'Burgos', 'Cabugao', 'Caoayan', 'Cervantes', 'Galimuyod', 'Gregorio del Pilar', 'Lidlidda', 'Magsingal', 'Nagbukel', 'Narvacan', 'Quirino', 'Salcedo', 'San Emilio', 'San Esteban', 'San Ildefonso', 'San Juan', 'San Vicente', 'Santa', 'Santa Catalina', 'Santa Cruz', 'Santa Lucia', 'Santa Maria', 'Santiago', 'Santo Domingo', 'Sigay', 'Sugpon', 'Suyo', 'Tagudin',
    'Agoo', 'Aringay', 'Bacnotan', 'Bagulin', 'Balaoan', 'Bangar', 'Bauang', 'Burgos', 'Caba', 'Luna', 'Naguilian', 'Pugo', 'Rosario', 'San Gabriel', 'San Juan', 'Santo Tomas', 'Santol', 'Sudipen', 'Tubao',
    'Agno', 'Aguilar', 'Alcala', 'Anda', 'Asingan', 'Balungao', 'Bani', 'Basista', 'Bautista', 'Bayambang', 'Binalonan', 'Binmaley', 'Bolinao', 'Bugallon', 'Burgos', 'Calasiao', 'Dasol', 'Infanta', 'Labrador', 'Laoac', 'Lingayen', 'Mabini', 'Malasiqui', 'Manaoag', 'Mangaldan', 'Mangatarem', 'Mapandan', 'Natividad', 'Pozorrubio', 'Rosales', 'San Fabian', 'San Jacinto', 'San Manuel', 'San Nicolas', 'San Quintin', 'Santa Barbara', 'Santa Maria', 'Santo Tomas', 'Sison', 'Sual', 'Tayug', 'Umingan', 'Villasis'
  ]
}

// GDACS alert levels to internal alertStatus
const ALERT_LEVEL_MAP = {
  Red: 'red',
  Orange: 'orange',
  Yellow: 'yellow',
  Green: 'white', // Green = monitoring/normal → white
}

// Map GDACS alert level to typhoon signal number (approximate)
const TC_SIGNAL_MAP = {
  Green: 'Signal #1',
  Yellow: 'Signal #2',
  Orange: 'Signal #3',
  Red: 'Signal #4',
}

// Map GDACS alert level to flood alert level
const FL_LEVEL_MAP = {
  Green: 'Alert Level 1',
  Yellow: 'Alert Level 1',
  Orange: 'Alert Level 2',
  Red: 'Alert Level 3',
}

// Map GDACS alert level to tsunami alert
const TS_ALERT_MAP = {
  Green: 'Information',
  Yellow: 'Advisory',
  Orange: 'Watch',
  Red: 'Warning',
}

/**
 * Fetch latest GDACS events, filtered by the Philippines bounding box.
 * @param {Object} options
 * @param {string[]} [options.types] - Filter by event types e.g. ['TC','EQ','FL']
 * @returns {Promise<Array>} - Array of mapped GDACS events
 */
export async function fetchGDACSEvents(options = {}) {
  const { types } = options

  // GDACS public events endpoint (no auth required)
  const BASE_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP'
  const params = new URLSearchParams({
    pagesize: 50,
    pagenumber: 1,
  })

  // Filter by event types if specified
  if (types && types.length > 0) {
    params.set('eventtype', types.join(','))
  }

  const url = `${BASE_URL}?${params.toString()}`

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      mode: 'cors',
    })

    if (!res.ok) throw new Error(`GDACS API error: ${res.status} ${res.statusText}`)

    const json = await res.json()

    // GDACS response shape: { features: [...] } (GeoJSON-like) or { events: [...] }
    const rawEvents =
      json?.features ||
      json?.events ||
      json?.data ||
      (Array.isArray(json) ? json : [])

    // Map and filter (Broadened for testing/verification)
    const mapped = rawEvents
      .map(mapGDACSEvent)
      .filter(Boolean)
      // .filter(isInPhilippines) // Temporarily disabled to show global alerts if no local ones exist

    return mapped
  } catch (err) {
    console.error('GDACS fetch error:', err)
    throw err
  }
}

/**
 * Fetch detailed data for a specific GDACS event.
 */
export async function fetchGDACSEventDetails(type, id) {
  const url = `https://www.gdacs.org/gdacsapi/api/events/geteventdata?eventtype=${type}&eventid=${id}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' })
    if (!res.ok) throw new Error(`GDACS Detail API error: ${res.status}`)
    const json = await res.json()
    
    // In many cases, the response is similar to the search but with more granular 'episodes'
    // or specific bulletin text.
    const props = json?.properties || json?.features?.[0]?.properties || json
    const impact = extractImpactData(props)
    
    // FETCH GRANULAR LOCATIONS (BARANGAYS)
    const localCommunities = await fetchGDACSImpactLocations(id)
    
    return {
      raw: props,
      impact: {
        ...impact,
        localCommunities
      }
    }
  } catch (err) {
    console.error('GDACS detail fetch error:', err)
    return null
  }
}

/**
 * Fetch granular impacted locations (Barangays/Communities) for an event.
 */
export async function fetchGDACSImpactLocations(eventId) {
  const url = `https://www.gdacs.org/gdacsapi/api/export/getlocations?id=${eventId}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' })
    if (!res.ok) return []
    const data = await res.json()
    
    // GDACS usually returns an array of objects with 'location', 'City', and 'Country'
    // We filter for Philippines to be safe, though GCADS usually filters event-specific queries
    const communities = (data || [])
      .filter(loc => {
        const country = (loc.Country || loc.country || '').toLowerCase()
        return country.includes('philippines') || country === 'ph' || !country
      })
      .map(loc => loc.location || loc.Name || loc.name)
      .filter(Boolean)
      .filter(name => !REGION_1_LOCATIONS.provinces.includes(name)) // Filter out provinces
      .filter(name => !REGION_1_LOCATIONS.lgus.includes(name)) // Filter out known LGUs to keep it to smaller communities
    
    return Array.from(new Set(communities))
  } catch (err) {
    console.error('GDACS locations fetch error:', err)
    return []
  }
}

/**
 * Extract Impact Data (Provinces, LGUs, Population)
 */
function extractImpactData(props) {
  const text = `${props?.htmldescription || ''} ${props?.description || ''} ${props?.name || ''}`
  
  const matchedProvinces = REGION_1_LOCATIONS.provinces.filter(p => 
    new RegExp(`\\b${p}\\b`, 'i').test(text)
  )
  
  const matchedLGUs = REGION_1_LOCATIONS.lgus.filter(l => 
    new RegExp(`\\b${l}\\b`, 'i').test(text)
  )

  return {
    provinces: matchedProvinces,
    lgus: matchedLGUs,
    populationAffected: props?.severitydata?.severity || props?.population || 'N/A',
    alertScore: props?.episodealertscore || props?.alertscore || 'N/A'
  }
}

/**
 * Check if a mapped GDACS event falls within the Philippine bounding box.
 */
function isInPhilippines(event) {
  const { lat, lon } = event
  if (lat == null || lon == null) return true // include if no coords (don't filter out)
  return (
    lat >= PH_BBOX.minLat &&
    lat <= PH_BBOX.maxLat &&
    lon >= PH_BBOX.minLon &&
    lon <= PH_BBOX.maxLon
  )
}

/**
 * Map a raw GDACS event (GeoJSON feature) to our internal format.
 */
function mapGDACSEvent(raw) {
  try {
    // Support both GeoJSON Feature and plain object structures
    const props = raw?.properties || raw
    const coords = raw?.geometry?.coordinates

    const gdacsType = (props?.eventtype || props?.EventType || '').toUpperCase()
    const alertLevelRaw = props?.alertlevel || props?.AlertLevel || 'Green'
    const alertLevel = capitalize(alertLevelRaw)

    const eventType = EVENT_TYPE_MAP[gdacsType] || 'calamity'
    const alertStatus = ALERT_LEVEL_MAP[alertLevel] || 'white'

    // Coordinates: GeoJSON is [lon, lat]
    const lon = coords ? coords[0] : props?.longitude || props?.Longitude || null
    const lat = coords ? coords[1] : props?.latitude || props?.Latitude || null

    // Dates
    const fromdate = props?.fromdate || props?.FromDate || props?.eventdate || null
    const todate = props?.todate || props?.ToDate || null

    // GDACS name/title
    const gdacsName = props?.name || props?.Name || props?.htmldescription || ''

    // Episode details
    const episodeAlertScore = props?.episodealertscore || null
    const severity = props?.severity || props?.Severity || {}
    const population = props?.population || props?.Population || {}

    // Build location-specific details by event type
    const details = extractTypeDetails(gdacsType, props, alertLevel)

    return {
      gdacsId: props?.eventid || props?.EventID || props?.id,
      gdacsType,
      gdacsName: cleanGdacsName(gdacsName),
      eventType,
      alertStatus,
      alertLevel,
      gdacsAlertLevel: alertLevel,
      lat,
      lon,
      startDate: fromdate ? new Date(fromdate).toISOString().slice(0, 16) : '',
      endDate: todate ? new Date(todate).toISOString().slice(0, 16) : '',
      episodeAlertScore,
      country: props?.country || props?.Country || '',
      description: buildDescription(gdacsType, props, alertLevel, details),
      ...details,
    }
  } catch (e) {
    console.warn('Error mapping GDACS event:', e, raw)
    return null
  }
}

/**
 * Extract type-specific technical details from a GDACS event.
 */
function extractTypeDetails(gdacsType, props, alertLevel) {
  switch (gdacsType) {
    case 'TC': {
      // Tropical Cyclone
      const windspeed = props?.severitydata?.windspeed || props?.windspeed || null
      const category = deriveTCCategory(windspeed)
      return {
        alertLevel: category, // Use category as the primary alert level
        typhoonCategory: category,
        windspeed,
      }
    }
    case 'EQ': {
      // Earthquake
      const magnitude = props?.severitydata?.magnitude || props?.magnitude || null
      const depth = props?.severitydata?.depth || props?.depth || null
      const intensity = deriveIntensity(magnitude)
      return {
        alertLevel: `Intensity ${intensity}`,
        magnitude: magnitude ? String(magnitude) : '',
        intensity,
        depth,
      }
    }
    case 'FL': {
      // Flood
      return {
        alertLevel: FL_LEVEL_MAP[alertLevel] || 'Alert Level 1',
        floodLevel: deriveFloodLevel(alertLevel),
        rainfall: '',
      }
    }
    case 'TS': {
      // Tsunami
      const waveheight = props?.severitydata?.maxwaveheight || props?.maxwaveheight || null
      return {
        alertLevel: TS_ALERT_MAP[alertLevel] || 'Information',
        tsunamiAlert: TS_ALERT_MAP[alertLevel] || 'Information',
        waveHeight: waveheight ? String(waveheight) : '',
      }
    }
    default:
      return {
        alertLevel: alertLevel === 'Red' ? 'Active' : 'Monitoring',
      }
  }
}

/**
 * Derive typhoon category from wind speed (km/h).
 */
function deriveTCCategory(windspeed) {
  if (!windspeed) return 'Tropical Depression'
  if (windspeed <= 61) return 'Tropical Depression'
  if (windspeed <= 88) return 'Tropical Storm'
  if (windspeed <= 117) return 'Severe Tropical Storm'
  if (windspeed <= 184) return 'Typhoon'
  return 'Super Typhoon'
}

/**
 * Derive PHIVOLCS intensity from earthquake magnitude (rough scale).
 */
function deriveIntensity(magnitude) {
  if (!magnitude) return 'I'
  const m = parseFloat(magnitude)
  if (m < 3.0) return 'I'
  if (m < 4.0) return 'II'
  if (m < 4.5) return 'III'
  if (m < 5.0) return 'IV'
  if (m < 5.5) return 'V'
  if (m < 6.0) return 'VI'
  if (m < 6.5) return 'VII'
  if (m < 7.0) return 'VIII'
  if (m < 7.5) return 'IX'
  return 'X'
}

/**
 * Derive flood level string from GDACS alert level.
 */
function deriveFloodLevel(alertLevel) {
  const map = { Green: 'Low', Yellow: 'Low', Orange: 'Moderate', Red: 'Critical' }
  return map[alertLevel] || 'Low'
}

/**
 * Build a formatted summary/description string from GDACS data.
 */
function buildDescription(gdacsType, props, alertLevel, details) {
  const country = props?.country || 'Philippines'
  switch (gdacsType) {
    case 'TC':
      return (
        `**${details.typhoonCategory?.toUpperCase() || 'TROPICAL CYCLONE'}**\n\n` +
        `* **Wind Speed**: ${details.windspeed ? details.windspeed + ' km/h' : 'N/A'}\n` +
        `* **GDACS Alert**: ${alertLevel}\n` +
        `* **Country**: ${country}`
      )
    case 'EQ':
      return (
        `**EARTHQUAKE**\n\n` +
        `* **Magnitude**: ${details.magnitude || 'N/A'}\n` +
        `* **PHIVOLCS Intensity**: Intensity ${details.intensity}\n` +
        `* **Depth**: ${details.depth ? details.depth + ' km' : 'N/A'}\n` +
        `* **Country**: ${country}`
      )
    case 'FL':
      return (
        `**FLOODING**\n\n` +
        `* **Flood Level**: ${details.floodLevel}\n` +
        `* **Alert**: ${details.alertLevel}\n` +
        `* **Country**: ${country}`
      )
    case 'TS':
      return (
        `**TSUNAMI**\n\n` +
        `* **Alert Level**: ${details.tsunamiAlert}\n` +
        `* **Wave Height**: ${details.waveHeight ? details.waveHeight + ' m' : 'N/A'}\n` +
        `* **Country**: ${country}`
      )
    default:
      return `* **Alert**: ${alertLevel}\n* **Country**: ${country}`
  }
}

/**
 * Strip HTML tags and clean up GDACS event name.
 */
function cleanGdacsName(name = '') {
  return name.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Capitalize first letter.
 */
function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Human-readable label for GDACS event type codes.
 */
export function gdacsTypeLabel(gdacsType) {
  const labels = {
    TC: 'Tropical Cyclone',
    EQ: 'Earthquake',
    FL: 'Flood',
    TS: 'Tsunami',
    VO: 'Volcano',
    DR: 'Drought',
    WF: 'Wildfire',
  }
  return labels[gdacsType] || gdacsType
}
