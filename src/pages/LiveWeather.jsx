import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { 
  MagnifyingGlass, Compass, Plus, Minus, Play, Pause, MapPin, Info, Bell, 
  CaretDown, CaretUp, CloudRain, Warning, Wind, Thermometer, Drop, Lightbulb, 
  Clock, ShieldWarning
} from '@phosphor-icons/react'
import 'leaflet/dist/leaflet.css'
import '../styles/pages/LiveWeather.css'

// Helper component to control Map focus and viewport
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

// Mock Cyclone Track Data for PEPITO
const CYCLONE_TRACK = [
  { lat: 14.5, lng: 124.5, time: 'Mon, Jul 13 08:00 AM', speed: '120 km/h', pressure: '975 hPa', type: 'TS' },
  { lat: 15.2, lng: 123.1, time: 'Mon, Jul 13 08:00 PM', speed: '145 km/h', pressure: '960 hPa', type: 'STS' },
  { lat: 15.9, lng: 121.8, time: 'Tue, Jul 14 08:00 AM', speed: '185 km/h', pressure: '940 hPa', type: 'TY' },
  { lat: 16.5, lng: 120.3, time: 'Tue, Jul 14 08:00 PM', speed: '215 km/h', pressure: '920 hPa', type: 'STY', current: true },
  { lat: 17.1, lng: 118.8, time: 'Wed, Jul 15 08:00 AM (Forecast)', speed: '175 km/h', pressure: '945 hPa', type: 'TY', forecast: true },
  { lat: 17.6, lng: 117.2, time: 'Wed, Jul 15 08:00 PM (Forecast)', speed: '150 km/h', pressure: '955 hPa', type: 'TY', forecast: true },
  { lat: 18.2, lng: 115.5, time: 'Thu, Jul 16 08:00 AM (Forecast)', speed: '110 km/h', pressure: '980 hPa', type: 'TS', forecast: true }
];

// Mock Synoptic Stations in Region 1
const SYNOPTIC_STATIONS = [
  { name: 'Laoag City Station', lat: 18.18, lng: 120.59, temp: '26.8°C', wind: '22 km/h WNW', pressure: '998.4 hPa', humidity: '92%' },
  { name: 'Vigan City Station', lat: 17.57, lng: 120.38, temp: '25.4°C', wind: '25 km/h W', pressure: '997.9 hPa', humidity: '95%' },
  { name: 'Dagupan City Station', lat: 16.04, lng: 120.34, temp: '27.2°C', wind: '18 km/h SW', pressure: '999.1 hPa', humidity: '89%' },
  { name: 'Sinait Station', lat: 17.85, lng: 120.45, temp: '26.0°C', wind: '20 km/h W', pressure: '998.1 hPa', humidity: '93%' }
];

// Mock Automatic Weather Stations (AWS) in Region 1
const AWS_STATIONS = [
  { name: 'AWS Pagudpud', lat: 18.59, lng: 120.78, rain: '4.5 mm/h', wind: '35 km/h', temp: '24.5°C' },
  { name: 'AWS Batac', lat: 18.06, lng: 120.54, rain: '1.2 mm/h', wind: '15 km/h', temp: '25.8°C' },
  { name: 'AWS Candon', lat: 17.19, lng: 120.45, rain: '12.8 mm/h', wind: '42 km/h', temp: '23.9°C' },
  { name: 'AWS San Fernando', lat: 16.61, lng: 120.31, rain: '18.4 mm/h', wind: '48 km/h', temp: '24.1°C' },
  { name: 'AWS Alaminos', lat: 16.15, lng: 119.98, rain: '0.5 mm/h', wind: '12 km/h', temp: '26.5°C' },
  { name: 'AWS Urdaneta', lat: 15.97, lng: 120.57, rain: '8.2 mm/h', wind: '28 km/h', temp: '25.0°C' }
];

// Mock Lightning Strikes (randomized coords in Region 1)
const LIGHTNING_STRIKES = [
  { lat: 16.8, lng: 120.7, time: 'Just now', intensity: 'High' },
  { lat: 17.4, lng: 120.2, time: '2 mins ago', intensity: 'Medium' },
  { lat: 16.3, lng: 120.5, time: '5 mins ago', intensity: 'Low' },
  { lat: 18.2, lng: 120.8, time: '8 mins ago', intensity: 'Medium' }
];

// RainViewer Base API
const RAINVIEWER_API_JSON = 'https://api.rainviewer.com/public/weather-maps.json';

export default function LiveWeather() {
  const [mapCenter, setMapCenter] = useState([16.5, 120.5]);
  const [mapZoom, setMapZoom] = useState(8);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion Sections State
  const [activeSections, setActiveSections] = useState({
    cycloneTrack: true,
    synopticStation: false,
    aws: false,
    lightning: false,
    satellite: false,
    doppler: true // Doppler Radar ON by default for high visual impact
  });

  // Layer Visibility Toggles
  const [layers, setLayers] = useState({
    cycloneTrack: true,
    synopticStation: false,
    aws: false,
    lightning: false,
    satellite: false,
    doppler: true
  });

  // RainViewer Radar Timestamps & Scrubber
  const [radarTimestamps, setRadarTimestamps] = useState([]);
  const [scrubberIndex, setScrubberIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  // Floating Info Card / Alert Popups
  const [showInfoCard, setShowInfoCard] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Simulated Weather Warnings (Bell icon items)
  const weatherWarnings = [
    { id: 1, title: 'Red Rainfall Warning', details: 'La Union & Southern Ilocos Sur. Serious flooding is expected in low-lying areas.', type: 'critical' },
    { id: 2, title: 'Storm Signal No. 3', details: 'Ilocos Norte, Ilocos Sur, La Union. Winds of 89-117 km/h expected in 18 hours.', type: 'major' },
    { id: 3, title: 'Gale Warning', details: 'Seaboards of Northern Luzon. Sea travel is risky for small seacrafts.', type: 'warning' }
  ];

  // Fetch RainViewer radar timestamps for live Doppler rendering
  useEffect(() => {
    fetch(RAINVIEWER_API_JSON)
      .then(res => res.json())
      .then(data => {
        if (data && data.radar && data.radar.past) {
          const formatted = data.radar.past.map(item => {
            const dateObj = new Date(item.time * 1000);
            return {
              time: item.time,
              datetime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
              date: dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
            };
          });
          setRadarTimestamps(formatted);
          setScrubberIndex(formatted.length - 1); // default to latest radar frame
        }
      })
      .catch(err => {
        console.error('[LiveWeather] Failed to load RainViewer timestamps, constructing mock timelines:', err);
        // Fallback mock timestamps if API fails or network is blocked
        const now = Math.floor(Date.now() / 1000);
        const mock = [...Array(12).keys()].reverse().map(i => {
          const time = now - (i * 10 * 60); // 10 mins steps
          const dateObj = new Date(time * 1000);
          return {
            time,
            datetime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            date: dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
          };
        });
        setRadarTimestamps(mock);
        setScrubberIndex(mock.length - 1);
      });
  }, []);

  // Timeline playback controller
  useEffect(() => {
    if (isPlaying && radarTimestamps.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setScrubberIndex(prev => (prev + 1) % radarTimestamps.length);
      }, 1500); // 1.5 seconds per frame transition
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, radarTimestamps]);

  const toggleSection = (section) => {
    setActiveSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLayer = (layerKey, val) => {
    setLayers(prev => ({ ...prev, [layerKey]: val }));
  };

  // GPS Locate User Mock
  const handleLocateMe = () => {
    // Center at San Fernando City (regional center) or simulate GPS
    setMapCenter([16.61, 120.31]);
    setMapZoom(11);
  };

  // Zoom control helpers
  const handleZoomIn = () => setMapZoom(prev => Math.min(18, prev + 1));
  const handleZoomOut = () => setMapZoom(prev => Math.max(4, prev - 1));

  // Search handler
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase().trim();
    if (query.includes('laoag')) {
      setMapCenter([18.18, 120.59]);
      setMapZoom(12);
    } else if (query.includes('vigan')) {
      setMapCenter([17.57, 120.38]);
      setMapZoom(12);
    } else if (query.includes('dagupan') || query.includes('lingayen')) {
      setMapCenter([16.04, 120.34]);
      setMapZoom(12);
    } else if (query.includes('san fernando')) {
      setMapCenter([16.61, 120.31]);
      setMapZoom(12);
    } else {
      alert(`Location "${searchQuery}" not found in mock list. Try "Laoag", "Vigan", "San Fernando", or "Dagupan".`);
    }
  };

  // Get active scrubber timestamp data
  const activeFrame = radarTimestamps[scrubberIndex] || { datetime: 'Live Radar', date: 'Checking...' };

  // Helper to color code Cyclone Track categories
  const getCycloneColor = (type) => {
    switch (type) {
      case 'STY': return '#d946ef'; // Magenta
      case 'TY': return '#ef4444'; // Red
      case 'STS': return '#f97316'; // Orange
      case 'TS': return '#eab308'; // Yellow
      default: return '#3b82f6'; // Blue (LPA / TD)
    }
  };

  // Custom Icon for Cyclone Eye
  const cycloneEyeIcon = L.divIcon({
    className: 'cyclone-marker-icon',
    html: `<div style="
      width: 24px; 
      height: 24px; 
      border-radius: 50%; 
      background: radial-gradient(circle, #ff007f 30%, #ef4444 70%, transparent 100%); 
      border: 2px solid #ffffff; 
      box-shadow: 0 0 10px #ff007f;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <div className="live-weather-container">
      {/* ── Left Accordion Floating Panel ── */}
      <div className="floating-left-panel">
        <h3 style={{ margin: '0.25rem 0.5rem 0.75rem', fontWeight: 800, fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CloudRain size={20} weight="fill" style={{ color: '#4f46e5' }} />
          Weather Control Center
        </h3>

        {/* 1. Cyclone Track Section */}
        <div className="accordion-section">
          <button className="accordion-header" onClick={() => toggleSection('cycloneTrack')}>
            <div className="accordion-header-left">
              <Warning size={18} weight="bold" style={{ color: '#ef4444' }} />
              <span>Cyclone Track</span>
            </div>
            <CaretDown size={14} className={`accordion-chevron ${activeSections.cycloneTrack ? 'rotated' : ''}`} />
          </button>
          {activeSections.cycloneTrack && (
            <div className="accordion-content">
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ACTIVE CYCLONES</span>
              <div className="cyclone-list">
                <div 
                  className={`cyclone-item ${layers.cycloneTrack ? 'selected' : ''}`}
                  onClick={() => toggleLayer('cycloneTrack', !layers.cycloneTrack)}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>STY PEPITO</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Winds: 215 km/h · STY</span>
                  </div>
                  <span className="cyclone-status-badge">Signal #3</span>
                </div>
              </div>
              <div className="layer-toggle-row">
                <span className="layer-toggle-label">Render Track Overlay</span>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={layers.cycloneTrack} 
                    onChange={e => toggleLayer('cycloneTrack', e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 2. Synoptic Station Section */}
        <div className="accordion-section">
          <button className="accordion-header" onClick={() => toggleSection('synopticStation')}>
            <div className="accordion-header-left">
              <Thermometer size={18} weight="bold" />
              <span>Synoptic Stations</span>
            </div>
            <CaretDown size={14} className={`accordion-chevron ${activeSections.synopticStation ? 'rotated' : ''}`} />
          </button>
          {activeSections.synopticStation && (
            <div className="accordion-content">
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Official PAGASA weather observatories plotting live parameters.
              </p>
              <div className="layer-toggle-row">
                <span className="layer-toggle-label">Show Synoptic Markers</span>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={layers.synopticStation} 
                    onChange={e => toggleLayer('synopticStation', e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 3. Automatic Weather Station Section */}
        <div className="accordion-section">
          <button className="accordion-header" onClick={() => toggleSection('aws')}>
            <div className="accordion-header-left">
              <Wind size={18} weight="bold" />
              <span>Automatic Weather Stations</span>
            </div>
            <CaretDown size={14} className={`accordion-chevron ${activeSections.aws ? 'rotated' : ''}`} />
          </button>
          {activeSections.aws && (
            <div className="accordion-content">
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Regional AWS telemetry networks recording live rain gauges.
              </p>
              <div className="layer-toggle-row">
                <span className="layer-toggle-label">Show AWS Sensors</span>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={layers.aws} 
                    onChange={e => toggleLayer('aws', e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 4. Lightning Data Section */}
        <div className="accordion-section">
          <button className="accordion-header" onClick={() => toggleSection('lightning')}>
            <div className="accordion-header-left">
              <Lightbulb size={18} weight="bold" style={{ color: '#eab308' }} />
              <span>Lightning Data</span>
            </div>
            <CaretDown size={14} className={`accordion-chevron ${activeSections.lightning ? 'rotated' : ''}`} />
          </button>
          {activeSections.lightning && (
            <div className="accordion-content">
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Real-time electrostatic lightning strikes mapping convective thunderstorm activity.
              </p>
              <div className="layer-toggle-row">
                <span className="layer-toggle-label">Show Lightning Strikes</span>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={layers.lightning} 
                    onChange={e => toggleLayer('lightning', e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 5. Satellite Imagery Section */}
        <div className="accordion-section">
          <button className="accordion-header" onClick={() => toggleSection('satellite')}>
            <div className="accordion-header-left">
              <Drop size={18} weight="bold" style={{ color: '#06b6d4' }} />
              <span>Satellite Imagery</span>
            </div>
            <CaretDown size={14} className={`accordion-chevron ${activeSections.satellite ? 'rotated' : ''}`} />
          </button>
          {activeSections.satellite && (
            <div className="accordion-content">
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Himawari-9 thermal infrared cloud top brightness overlay.
              </p>
              <div className="layer-toggle-row">
                <span className="layer-toggle-label">Show Satellite Cloud Layer</span>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={layers.satellite} 
                    onChange={e => toggleLayer('satellite', e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 6. Doppler Radar Section */}
        <div className="accordion-section">
          <button className="accordion-header" onClick={() => toggleSection('doppler')}>
            <div className="accordion-header-left">
              <CloudRain size={18} weight="bold" />
              <span>Doppler Radar</span>
            </div>
            <CaretDown size={14} className={`accordion-chevron ${activeSections.doppler ? 'rotated' : ''}`} />
          </button>
          {activeSections.doppler && (
            <div className="accordion-content">
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                Live precipitation radar loop mapping rain intensities via RainViewer API feeds.
              </p>
              <div className="layer-toggle-row">
                <span className="layer-toggle-label">Show Radar Precipitation</span>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={layers.doppler} 
                    onChange={e => toggleLayer('doppler', e.target.checked)} 
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top-Center Search Bar & Legend ── */}
      <div className="top-center-controls">
        <form onSubmit={handleSearchSubmit} className="search-box-wrapper">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search location (e.g. Laoag, Vigan, Dagupan...)" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-btn-icon" title="Search">
            <MagnifyingGlass size={16} weight="bold" />
          </button>
          <div className="divider-line" />
          <button type="button" className="search-btn-icon" onClick={handleLocateMe} title="My Location">
            <Compass size={16} weight="bold" />
          </button>
          <div className="divider-line" />
          <button type="button" className="search-btn-icon" onClick={handleZoomIn} title="Zoom In">
            <Plus size={14} weight="bold" />
          </button>
          <button type="button" className="search-btn-icon" onClick={handleZoomOut} title="Zoom Out">
            <Minus size={14} weight="bold" />
          </button>
        </form>

        {/* PAGASA Tropical Cyclone Categories Scale Legend */}
        <div className="intensity-legend-bar">
          <span style={{ color: '#0f172a', fontWeight: 700, marginRight: '0.25rem' }}>PAGASA TC Category:</span>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#3b82f6' }} />
            <span>LPA/TD</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#eab308' }} />
            <span>TS</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#f97316' }} />
            <span>STS</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#ef4444' }} />
            <span>TY</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: '#d946ef' }} />
            <span>STY</span>
          </div>
          <div className="legend-item" style={{ marginLeft: '0.25rem' }}>
            <div className="legend-line" style={{ borderTop: '2px dashed #64748b' }} />
            <span>Forecast</span>
          </div>
        </div>
      </div>

      {/* ── Top-Right Icon Cluster ── */}
      <div className="top-right-cluster">
        <button 
          className="circle-icon-btn" 
          onClick={handleLocateMe} 
          title="Zoom to Region 1"
          style={{ color: '#4f46e5' }}
        >
          <MapPin size={18} weight="bold" />
        </button>
        <button 
          className="circle-icon-btn" 
          onClick={() => {
            setShowInfoCard(!showInfoCard);
            setShowAlerts(false);
          }} 
          title="Source Information"
        >
          <Info size={18} weight="bold" />
        </button>
        <button 
          className="circle-icon-btn" 
          onClick={() => {
            setShowAlerts(!showAlerts);
            setShowInfoCard(false);
          }} 
          title="Weather Warnings"
          style={{ position: 'relative' }}
        >
          <Bell size={18} weight="bold" />
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444', border: '1px solid #ffffff'
          }} />
        </button>
      </div>

      {/* Info Card Popover */}
      {showInfoCard && (
        <div className="info-overlay-card">
          <div className="info-overlay-title">Data Integration Sources</div>
          <p style={{ margin: '0 0 0.5rem' }}>
            This weather radar system operates primarily on mock models styled after localized DOST dashboards.
          </p>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
            <strong>Active Feeds:</strong><br />
            1. <strong>Doppler radar:</strong> Live images requested dynamically from the <strong>RainViewer API</strong>.<br />
            2. <strong>Cyclone Track:</strong> Track plotting matching typhoon advisories from <strong>PAGASA API</strong>.<br />
            3. <strong>Observatories:</strong> Synoptic and AWS stations telemetry mapped to <strong>DOST Panahon API / ASTI database</strong>.
          </p>
        </div>
      )}

      {/* Weather Alerts Warning List Popover */}
      {showAlerts && (
        <div className="notification-overlay-list">
          {weatherWarnings.map(w => (
            <div key={w.id} className="notification-overlay-item">
              <ShieldWarning size={20} weight="fill" className="notification-overlay-icon" />
              <div>
                <div className="notification-overlay-title">{w.title}</div>
                <div>{w.details}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Right-Edge Vertical Rainfall Scale Bar ── */}
      <div className="right-scale-bar">
        <div className="scale-label-container">
          <div className="scale-label-unit">mm / 1h</div>
          <div>60.0 +</div>
          <div>30.0</div>
          <div>10.0</div>
          <div>3.0</div>
          <div>1.0</div>
          <div>0.3</div>
          <div>0.0</div>
        </div>
        <div className="scale-gradient-bar" />
      </div>

      {/* ── Bottom Timeline Scrubber Bar ── */}
      <div className="bottom-scrubber-bar">
        <button 
          className="scrubber-play-btn" 
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause' : 'Play Loop'}
        >
          {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
        </button>

        <div className="scrubber-track-wrapper">
          <div className="scrubber-slider-container">
            {radarTimestamps.length > 0 && (
              <div 
                className="timeline-tooltip"
                style={{ left: `${(scrubberIndex / (radarTimestamps.length - 1)) * 100}%` }}
              >
                {activeFrame.datetime}
              </div>
            )}
            <input 
              type="range" 
              min="0" 
              max={Math.max(0, radarTimestamps.length - 1)} 
              step="1"
              value={scrubberIndex} 
              onChange={e => {
                setScrubberIndex(parseInt(e.target.value));
                setIsPlaying(false); // stop playing when manual scrub occurs
              }}
              className="timeline-slider"
            />
          </div>
          <div className="timeline-labels">
            {radarTimestamps.length > 0 ? (
              <>
                <span>{radarTimestamps[0].datetime} ({radarTimestamps[0].date})</span>
                <span style={{ color: '#4f46e5', fontWeight: 800 }}>LIVE NOW</span>
              </>
            ) : (
              <span>Timeline Loading...</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Leaflet Weather Map ── */}
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        className="live-weather-map"
        zoomControl={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {/* Dark style CartoDB base map */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* RainViewer Live Radar Tile Overlay */}
        {layers.doppler && radarTimestamps.length > 0 && (
          <TileLayer
            key={`radar-${radarTimestamps[scrubberIndex]?.time}`}
            url={`https://tilecache.rainviewer.com/v2/radar/${radarTimestamps[scrubberIndex]?.time}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.65}
            zIndex={100}
          />
        )}

        {/* Himawari-9 Satellite Cloud Overlay (Mocked via OpenWeatherMap or standard weather maps) */}
        {layers.satellite && (
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" // Placeholder or actual OWM Cloud tile layer in production
            opacity={0.3}
            zIndex={90}
          />
        )}

        {/* Cyclone Pepito Track Rendering */}
        {layers.cycloneTrack && (
          <>
            {/* Draw Path lines (Historical: solid red, Forecast: dashed) */}
            <Polyline 
              positions={CYCLONE_TRACK.filter(pt => !pt.forecast).map(pt => [pt.lat, pt.lng])} 
              color="#ef4444" 
              weight={3.5} 
            />
            <Polyline 
              positions={CYCLONE_TRACK.filter(pt => pt.forecast || pt.current).map(pt => [pt.lat, pt.lng])} 
              color="#64748b" 
              weight={3} 
              dashArray="6, 6" 
            />

            {/* Plot Coordinate Nodes */}
            {CYCLONE_TRACK.map((pt, idx) => {
              const markerColor = getCycloneColor(pt.type);
              return pt.current ? (
                // Current Hurricane Position Eye
                <Marker 
                  key={`eye-${idx}`} 
                  position={[pt.lat, pt.lng]} 
                  icon={cycloneEyeIcon}
                >
                  <Popup>
                    <div style={{ fontFamily: 'inherit', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#ef4444' }}>Current Position: STY PEPITO</strong><br />
                      <strong>Time:</strong> {pt.time}<br />
                      <strong>Max Winds:</strong> {pt.speed}<br />
                      <strong>Min Pressure:</strong> {pt.pressure}<br />
                      <strong style={{ color: '#d946ef' }}>Category: Super Typhoon (STY)</strong>
                    </div>
                  </Popup>
                </Marker>
              ) : (
                // Other historical / forecast coordinate points
                <CircleMarker 
                  key={`pt-${idx}`} 
                  center={[pt.lat, pt.lng]} 
                  radius={pt.forecast ? 5 : 6} 
                  pathOptions={{
                    fillColor: markerColor,
                    fillOpacity: pt.forecast ? 0.4 : 0.85,
                    color: pt.forecast ? '#64748b' : '#ffffff',
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: 'inherit', fontSize: '0.8rem' }}>
                      <strong>{pt.forecast ? 'Forecast Node' : 'Historical Node'}</strong><br />
                      <strong>Time:</strong> {pt.time}<br />
                      <strong>Max Winds:</strong> {pt.speed}<br />
                      <strong>Pressure:</strong> {pt.pressure}<br />
                      <strong>Category:</strong> {pt.type}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </>
        )}

        {/* Synoptic Observatories Rendering */}
        {layers.synopticStation && SYNOPTIC_STATIONS.map((st, idx) => (
          <CircleMarker
            key={`synoptic-${idx}`}
            center={[st.lat, st.lng]}
            radius={8}
            pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.9, color: '#ffffff', weight: 2 }}
          >
            <Popup>
              <div className="aws-popup-content">
                <div className="aws-popup-title">{st.name}</div>
                <div className="aws-popup-metric">
                  <span>Temperature:</span>
                  <span className="aws-popup-val">{st.temp}</span>
                </div>
                <div className="aws-popup-metric">
                  <span>Wind Velocity:</span>
                  <span className="aws-popup-val">{st.wind}</span>
                </div>
                <div className="aws-popup-metric">
                  <span>Atm. Pressure:</span>
                  <span className="aws-popup-val">{st.pressure}</span>
                </div>
                <div className="aws-popup-metric">
                  <span>Humidity:</span>
                  <span className="aws-popup-val">{st.humidity}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* AWS Stations Rendering */}
        {layers.aws && AWS_STATIONS.map((st, idx) => (
          <CircleMarker
            key={`aws-${idx}`}
            center={[st.lat, st.lng]}
            radius={7}
            pathOptions={{ fillColor: '#10b981', fillOpacity: 0.9, color: '#ffffff', weight: 1.5 }}
          >
            <Popup>
              <div className="aws-popup-content">
                <div className="aws-popup-title">{st.name}</div>
                <div className="aws-popup-metric">
                  <span>Rain Rate:</span>
                  <span className="aws-popup-val" style={{ color: '#10b981' }}>{st.rain}</span>
                </div>
                <div className="aws-popup-metric">
                  <span>Wind Speed:</span>
                  <span className="aws-popup-val">{st.wind}</span>
                </div>
                <div className="aws-popup-metric">
                  <span>Temperature:</span>
                  <span className="aws-popup-val">{st.temp}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Real-time Lightning Strike Telemetry */}
        {layers.lightning && LIGHTNING_STRIKES.map((st, idx) => (
          <CircleMarker
            key={`lightning-${idx}`}
            center={[st.lat, st.lng]}
            radius={9}
            pathOptions={{ fillColor: '#eab308', fillOpacity: 0.85, color: '#ffffff', weight: 1, dashArray: '2,2' }}
          >
            <Popup>
              <div style={{ fontFamily: 'inherit', fontSize: '0.8rem' }}>
                <strong style={{ color: '#eab308' }}>⚡ Lightning Discharge</strong><br />
                <strong>Discharged:</strong> {st.time}<br />
                <strong>Intensity:</strong> {st.intensity}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
