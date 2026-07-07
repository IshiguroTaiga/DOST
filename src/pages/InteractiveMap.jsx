import React, { useState, useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl, Polygon, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, X, MapPin, CheckCircle, Warning, MagnifyingGlass, Info, Stack, Eye, EyeSlash, Globe, Pencil, Trash, Camera, UploadSimple, ImageSquare, Tag, Package, House, Warehouse } from '@phosphor-icons/react'
import { useOutletContext } from 'react-router-dom'
import api, { resolvePdfUrl } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import SearchInput from '../components/SearchInput'
import SearchableSelect from '../components/SearchableSelect'
import Button from '../components/Button'
import '../styles/pages/InteractiveMap.css'

const PROVINCES = ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan']
const PH_OUTER_BOUNDS = [[4.0, 116.0], [21.5, 127.5]]
const WORLD_MASK = [
  [[-90, -180], [-90, 180], [90, 180], [90, -180]], 
  [[4.0, 116.0], [4.0, 127.5], [21.5, 127.5], [21.5, 116.0]]
]

const EQUIPMENT_TYPES = [
  { id: 'aws', label: 'AWS', full: 'Automated Weather Station' },
  { id: 'arg', label: 'ARG', full: 'Automated Rain Gauge' },
  { id: 'wlms', label: 'WLMS', full: 'Water Level Monitoring' },
  { id: 'peimnet', label: 'PEIMNET', full: 'Earthquake Monitoring' },
  { id: 'ctas', label: 'CTAS', full: 'Tsunami Alert' },
  { id: 'alerting', label: 'SIREN', full: 'Alerting Station' },
  { id: 'slms', label: 'SLMS', full: 'Sea Level Monitoring' },
  { id: 'evac', label: 'Evac Center', full: 'Evacuation Center' },
  { id: 'warehouse', label: 'Warehouse', full: 'Relief Warehouse' },
]

function MapEventsHandler({ onMapClick, isMarking, onZoomEnd }) {
  useMapEvents({
    click: (e) => {
      if (isMarking) onMapClick(e.latlng)
    },
    zoomend: (e) => {
      onZoomEnd(e.target.getZoom())
    }
  })
  return null
}

const getMarkerSize = (zoom) => {
  if (zoom >= 12) return 18
  if (zoom === 11) return 17
  if (zoom === 10) return 16
  if (zoom === 9) return 15
  if (zoom === 8) return 14
  if (zoom === 7) return 10
  return 7 // zoom <= 6
}

export default function InteractiveMap() {
  const { user } = useOutletContext()
  const fileInputRef = useRef(null)
  const [zoom, setZoom] = useState(8)

  const accountType = user?.account_type || user?.role || '';
  const isSuperAdmin = accountType === 'Super Admin';
  const isRegionalUser = accountType === 'Regional Admin' || accountType === 'Regional';
  const isProvincialUser = accountType === 'Provincial Admin' || accountType === 'Provincial';
  const isLguUser = accountType === 'LGU Admin' || accountType === 'LGU';

  const canAddStation = isSuperAdmin || isRegionalUser || isProvincialUser || isLguUser;
  
  const canEditStation = (station) => {
    if (isSuperAdmin || isRegionalUser) return true;
    if (isProvincialUser) {
      return station && station.province === user?.province;
    }
    if (isLguUser) {
      return station && station.province === user?.province && station.lgu === user?.city;
    }
    return false; // guest cannot edit
  };
  
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchSearchQuery] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('All')
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [activeEquipmentDetail, setActiveEquipmentDetail] = useState(null)
  const [isEditingDetail, setIsEditingDetail] = useState(false)
  const [detailEditData, setDetailEditData] = useState({ brand: '', model: '', specs: '', coverage: '', officer: '', contact: '' })
  
  const [modalPos, setModalPos] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    if (e.button !== 0 || isEditingDetail) return; // Only left click and not while editing inputs
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - modalPos.x,
      y: e.clientY - modalPos.y
    };
    e.preventDefault();
  };

  const [liveData, setLiveData] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [simulatedWeather, setSimulatedWeather] = useState(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
  const [secondsTick, setSecondsTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeEquipmentDetail) {
      const isEvac = activeEquipmentDetail.type.id === 'evac';
      const isWarehouse = activeEquipmentDetail.type.id === 'warehouse';
      
      if (isEvac) {
        setDetailEditData({
          max_capacity_families: activeEquipmentDetail.val.max_capacity_families || '',
          current_families: activeEquipmentDetail.val.current_families || '',
          cooling_areas: !!activeEquipmentDetail.val.cooling_areas,
          mobile_kitchen: !!activeEquipmentDetail.val.mobile_kitchen,
          mobile_water: !!activeEquipmentDetail.val.mobile_water,
          first_aid: !!activeEquipmentDetail.val.first_aid,
          officer: activeEquipmentDetail.val.officer || '',
          contact: activeEquipmentDetail.val.contact || '',
          specs: activeEquipmentDetail.val.specs || 'Evacuation Center',
          coverage: activeEquipmentDetail.val.coverage || `${activeEquipmentDetail.station.lgu}, ${activeEquipmentDetail.station.province}`
        });
      } else if (isWarehouse) {
        setDetailEditData({
          ffps_count: activeEquipmentDetail.val.ffps_count || '',
          ready_to_eat_count: activeEquipmentDetail.val.ready_to_eat_count || '',
          sleeping_kits_count: activeEquipmentDetail.val.sleeping_kits_count || '',
          mats_count: activeEquipmentDetail.val.mats_count || '',
          standby_funds: activeEquipmentDetail.val.standby_funds || '',
          trucks_count: activeEquipmentDetail.val.trucks_count || '',
          command_centers: !!activeEquipmentDetail.val.command_centers,
          manager: activeEquipmentDetail.val.manager || '',
          contact: activeEquipmentDetail.val.contact || '',
          specs: activeEquipmentDetail.val.specs || 'DSWD/LGU Prepositioned Warehouse',
          coverage: activeEquipmentDetail.val.coverage || `${activeEquipmentDetail.station.lgu}, ${activeEquipmentDetail.station.province}`
        });
      } else {
        setDetailEditData({
          brand: activeEquipmentDetail.val.brand || '',
          model: activeEquipmentDetail.val.model || '',
          specs: activeEquipmentDetail.val.specs || `Standard ${activeEquipmentDetail.type.label} Unit`,
          coverage: activeEquipmentDetail.val.coverage || `${activeEquipmentDetail.station.lgu}, ${activeEquipmentDetail.station.province}`,
          officer: activeEquipmentDetail.val.officer || `LDRRMO ${activeEquipmentDetail.station.lgu}`,
          contact: activeEquipmentDetail.val.contact || '09XX XXX XXXX',
          davis_did: activeEquipmentDetail.val.davis_did ? 'OCCUPIED' : '',
          davis_password: activeEquipmentDetail.val.davis_password ? 'OCCUPIED' : '',
          davis_api_token: activeEquipmentDetail.val.davis_api_token ? 'OCCUPIED' : '',
        });
      }
    } else {
      setIsEditingDetail(false);
      setLiveData(null);
      setLiveError(null);
    }
  }, [activeEquipmentDetail]);

  // 1. Live WeatherLink API Fetch Effect
  useEffect(() => {
    if (!activeEquipmentDetail) {
      setLiveData(null);
      setLiveError(null);
      return;
    }
    const typeId = activeEquipmentDetail.type.id;
    if (typeId !== 'aws' && typeId !== 'arg') {
      setLiveData(null);
      setLiveError(null);
      return;
    }

    const did = activeEquipmentDetail.val.davis_did;
    const password = activeEquipmentDetail.val.davis_password;
    const token = activeEquipmentDetail.val.davis_api_token || '5ECABC5CB8824E5D86D12115782CE2EC';

    if (did && password) {
      const fetchLiveData = async () => {
        try {
          setLiveLoading(true);
          setLiveError(null);
          const response = await api.get('/stations/davis-live', {
            params: { user: did, pass: password, apiToken: token }
          });
          setLiveData(response.data);
          setLastUpdatedTime(new Date());
        } catch (err) {
          console.error('Error fetching live Davis data:', err);
          setLiveError(err.response?.data?.error || 'Failed to load live WeatherLink feed.');
        } finally {
          setLiveLoading(false);
        }
      };

      fetchLiveData();
      const intervalId = setInterval(fetchLiveData, 15000); // refresh live data every 15s
      return () => clearInterval(intervalId);
    } else {
      setLiveError(null);
      setLiveLoading(false);
      setLiveData(null);
    }
  }, [activeEquipmentDetail]);

  // 2. Simulated Weather Update Effect (Always runs to provide dynamic fallbacks)
  useEffect(() => {
    if (!activeEquipmentDetail) {
      setSimulatedWeather(null);
      return;
    }

    const typeId = activeEquipmentDetail.type.id;
    if (typeId !== 'aws' && typeId !== 'arg') {
      return;
    }

    const lat = parseFloat(activeEquipmentDetail.station.latitude) || 16.0;
    const lng = parseFloat(activeEquipmentDetail.station.longitude) || 120.0;
    const coordSeed = Math.sin(lat) * Math.cos(lng);

    const baseTemp = Number((31.4 + (coordSeed * 2.5)).toFixed(1));
    const baseHumidity = Math.min(100, Math.max(0, Math.floor(69 + (coordSeed * 15))));
    const baseWind = Number((10.0 + (coordSeed * 4.5)).toFixed(1));
    const baseRain = coordSeed > 0.4 ? Number(((coordSeed - 0.4) * 4.0).toFixed(1)) : 0.0;

    const updateMockData = () => {
      const tempVar = (Math.random() - 0.5) * 0.2;
      const windVar = (Math.random() - 0.5) * 0.5;
      const humidityVar = (Math.random() - 0.5) * 1;
      
      setSimulatedWeather({
        temp_c: Number((baseTemp + tempVar).toFixed(1)),
        relative_humidity: Math.min(100, Math.max(0, Math.floor(baseHumidity + humidityVar))),
        wind_kph: Number((baseWind + windVar).toFixed(1)),
        rain_rate_mm: Number(baseRain.toFixed(1))
      });
      // Update timestamp when simulation ticks
      setLastUpdatedTime(new Date());
    };

    updateMockData();
    const intervalId = setInterval(updateMockData, 4000);
    return () => clearInterval(intervalId);
  }, [activeEquipmentDetail]);

  const handleSaveDetail = async () => {
    try {
      const station = activeEquipmentDetail.station;
      const typeId = activeEquipmentDetail.type.id;
      
      let updatedFields = {};
      if (typeId === 'evac') {
        updatedFields = {
          max_capacity_families: detailEditData.max_capacity_families,
          current_families: detailEditData.current_families,
          cooling_areas: detailEditData.cooling_areas,
          mobile_kitchen: detailEditData.mobile_kitchen,
          mobile_water: detailEditData.mobile_water,
          first_aid: detailEditData.first_aid,
          officer: detailEditData.officer,
          contact: detailEditData.contact,
          specs: detailEditData.specs,
          coverage: detailEditData.coverage
        };
      } else if (typeId === 'warehouse') {
        updatedFields = {
          ffps_count: detailEditData.ffps_count,
          ready_to_eat_count: detailEditData.ready_to_eat_count,
          sleeping_kits_count: detailEditData.sleeping_kits_count,
          mats_count: detailEditData.mats_count,
          standby_funds: detailEditData.standby_funds,
          trucks_count: detailEditData.trucks_count,
          command_centers: detailEditData.command_centers,
          manager: detailEditData.manager,
          contact: detailEditData.contact,
          specs: detailEditData.specs,
          coverage: detailEditData.coverage
        };
      } else {
        updatedFields = {
          brand: detailEditData.brand,
          model: detailEditData.model,
          specs: detailEditData.specs,
          coverage: detailEditData.coverage,
          officer: detailEditData.officer,
          contact: detailEditData.contact,
          davis_did: (typeId === 'aws' || typeId === 'arg') 
            ? (detailEditData.davis_did === 'OCCUPIED' ? station.equipment_details[typeId]?.davis_did : detailEditData.davis_did) 
            : undefined,
          davis_password: (typeId === 'aws' || typeId === 'arg') 
            ? (detailEditData.davis_password === 'OCCUPIED' ? station.equipment_details[typeId]?.davis_password : detailEditData.davis_password) 
            : undefined,
          davis_api_token: (typeId === 'aws' || typeId === 'arg') 
            ? (detailEditData.davis_api_token === 'OCCUPIED' ? station.equipment_details[typeId]?.davis_api_token : detailEditData.davis_api_token) 
            : undefined,
        };
      }

      const updatedEquipmentDetails = {
        ...station.equipment_details,
        [typeId]: {
          ...station.equipment_details[typeId],
          ...updatedFields,
          manual: true
        }
      };

      await api.patch(`/stations/${station.id}`, {
        equipment_details: updatedEquipmentDetails
      });

      // Update local state
      setStations(prev => prev.map(s => s.id === station.id ? { ...s, equipment_details: updatedEquipmentDetails } : s));
      setActiveEquipmentDetail(prev => ({
        ...prev,
        val: updatedEquipmentDetails[typeId],
        station: { ...prev.station, equipment_details: updatedEquipmentDetails }
      }));
      setIsEditingDetail(false);
    } catch (err) {
      alert('Failed to update equipment details.');
      console.error(err);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setModalPos({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!activeEquipmentDetail) setModalPos({ x: 0, y: 0 });
  }, [activeEquipmentDetail]);
  
  const [formData, setFormData] = useState({
    province: 'Ilocos Norte', lgu: '', address: '', latitude: '', longitude: '', photo_url: '',
    equipment: {
      aws: { active: false, brand: '', model: '', davis_did: '', davis_password: '', davis_api_token: '' },
      arg: { active: false, brand: '', model: '', davis_did: '', davis_password: '', davis_api_token: '' },
      wlms: { active: false, brand: '', model: '' },
      peimnet: { active: false, brand: '', model: '' },
      ctas: { active: false, brand: '', model: '' },
      alerting: { active: false, brand: '', model: '' },
      slms: { active: false, brand: '', model: '' },
      evac: { active: false, brand: '', model: '' },
      warehouse: { active: false, brand: '', model: '' },
    }
  })
  const [uploading, setUploading] = useState(false)

const ActiveStationIcon = useMemo(() => {
  try {
    const size = getMarkerSize(zoom);
    return L.divIcon({
      className: 'philsensors-marker active-station',
      html: '<div class="marker-circle"><div class="marker-dot"></div></div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -Math.round(size / 2)]
    });
  } catch (e) { return null; }
}, [zoom]);

const EvacCenterIcon = useMemo(() => {
  try {
    const size = getMarkerSize(zoom);
    return L.divIcon({
      className: 'philsensors-marker evac-station',
      html: `
        <div class="marker-circle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,115.55V208a16,16,0,0,1-16,16H168a8,8,0,0,1-8-8V172a12,12,0,0,0-12-12H108a12,12,0,0,0-12,12v44a8,8,0,0,1-8,8H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l72-65.45a16,16,0,0,1,21.66,0l72,65.45A16,16,0,0,1,224,115.55Z"></path>
          </svg>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -Math.round(size / 2)]
    });
  } catch (e) { return null; }
}, [zoom]);

const ReliefWarehouseIcon = useMemo(() => {
  try {
    const size = getMarkerSize(zoom);
    return L.divIcon({
      className: 'philsensors-marker warehouse-station',
      html: `
        <div class="marker-circle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256">
            <path d="M232,104a8,8,0,0,1-8,8h-8v88a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V112H32a8,8,0,0,1,0-16h8.8L84.13,38.8A15.93,15.93,0,0,1,96.8,32h62.4a15.93,15.93,0,0,1,12.67,6.8L215.2,96H224A8,8,0,0,1,232,104ZM56,112v88H200V112ZM159.2,48H96.8L58.8,96H197.2ZM144,144a16,16,0,1,1-16-16A16,16,0,0,1,144,144Z"></path>
          </svg>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -Math.round(size / 2)]
    });
  } catch (e) { return null; }
}, [zoom]);

const MultiDeviceIcon = useMemo(() => {
  try {
    const size = getMarkerSize(zoom);
    return L.divIcon({
      className: 'philsensors-marker multi-device-station',
      html: `
        <div class="marker-circle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256">
            <path d="M236.4,94.24l-96-64a15.89,15.89,0,0,0-16.8,0l-96,64a16,16,0,0,0,0,26.51l96,64a15.89,15.89,0,0,0,16.8,0l96-64a16,16,0,0,0,0-26.51ZM128,45.15,201.27,94,128,142.85,54.73,94ZM228,136a8,8,0,0,1-8,8c-1.39,0-53.79,35.86-92,35.86s-90.61-35.86-92-35.86a8,8,0,0,1,8.87-13.25c.34.22,46.12,30.82,83.13,30.82s82.79-30.6,83.13-30.82A8,8,0,0,1,228,136Zm0,40a8,8,0,0,1-8,8c-1.39,0-53.79,35.86-92,35.86s-90.61-35.86-92-35.86a8,8,0,0,1,8.87-13.25c.34.22,46.12,30.82,83.13,30.82s82.79-30.6,83.13-30.82A8,8,0,0,1,228,176Z"></path>
          </svg>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -Math.round(size / 2)]
    });
  } catch (e) { return null; }
}, [zoom]);

  useEffect(() => {
    fetchStations()
  }, [])

  // Auto Province Detection
  useEffect(() => {
    if (isProvincialUser) return; // Province is locked for provincial users
    const lat = parseFloat(formData.latitude);
    if (!isNaN(lat) && lat > 0) {
      let autoProvince = 'Pangasinan';
      if (lat > 17.85) autoProvince = 'Ilocos Norte';
      else if (lat > 16.95) autoProvince = 'Ilocos Sur';
      else if (lat > 16.25) autoProvince = 'La Union';
      if (formData.province !== autoProvince) {
        setFormData(prev => ({ ...prev, province: autoProvince }));
      }
    }
  }, [formData.latitude]);

  const fetchStations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stations')
      setStations(Array.isArray(response.data) ? response.data : [])
      setError(null)
    } catch (err) {
      console.error('Map Fetch Error:', err)
      setError('Could not load station data.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (station) => {
    if (!canEditStation(station)) {
      alert('You do not have permission to edit this station.');
      return;
    }
    setEditingId(station.id)
    const eq = {}
    EQUIPMENT_TYPES.forEach(t => {
      const detail = station.equipment_details?.[t.id];
      if (t.id === 'evac') {
        eq[t.id] = {
          active: !!detail,
          max_capacity_families: detail?.max_capacity_families || '',
          current_families: detail?.current_families || '',
          cooling_areas: !!detail?.cooling_areas,
          mobile_kitchen: !!detail?.mobile_kitchen,
          mobile_water: !!detail?.mobile_water,
          first_aid: !!detail?.first_aid,
          officer: detail?.officer || '',
          contact: detail?.contact || ''
        };
      } else if (t.id === 'warehouse') {
        eq[t.id] = {
          active: !!detail,
          ffps_count: detail?.ffps_count || '',
          ready_to_eat_count: detail?.ready_to_eat_count || '',
          sleeping_kits_count: detail?.sleeping_kits_count || '',
          mats_count: detail?.mats_count || '',
          standby_funds: detail?.standby_funds || '',
          trucks_count: detail?.trucks_count || '',
          command_centers: !!detail?.command_centers,
          manager: detail?.manager || '',
          contact: detail?.contact || ''
        };
      } else {
        eq[t.id] = {
          active: !!detail,
          brand: detail?.brand || '',
          model: detail?.model || '',
          davis_did: detail?.davis_did ? 'OCCUPIED' : '',
          davis_password: detail?.davis_password ? 'OCCUPIED' : '',
          davis_api_token: detail?.davis_api_token ? 'OCCUPIED' : '',
        }
      }
    })
    setFormData({
      province: station.province,
      lgu: station.lgu,
      address: station.address || '',
      latitude: station.latitude,
      longitude: station.longitude,
      photo_url: station.photo_url || '',
      equipment: eq
    })
    setIsDrawerOpen(true)
  }

  const handleDelete = async (id) => {
    const station = stations.find(s => s.id === id);
    if (!canEditStation(station)) {
      alert('You do not have permission to delete this station.');
      return;
    }
    if (!window.confirm('Delete this monitoring station?')) return
    try {
      await api.delete(`/stations/${id}`)
      fetchStations()
    } catch (err) { alert('Failed to delete.') }
  }

  const handleMapClick = (latlng) => {
    setFormData(prev => ({ ...prev, latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) }))
    setIsMarking(false)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)
    try {
      setUploading(true)
      const res = await api.post('/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFormData(prev => ({ ...prev, photo_url: res.data.url }))
    } catch (err) { alert('Photo upload failed.') } finally { setUploading(false) }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    if (isLguUser) {
      if (formData.province !== user?.province || formData.lgu !== user?.city) {
        alert(`LGU users can only manage stations in their assigned LGU (${user?.city}, ${user?.province}).`);
        return;
      }

      // Also validate coordinates belong to their province
      const lat = parseFloat(formData.latitude);
      if (!isNaN(lat)) {
        let autoProvince = 'Pangasinan';
        if (lat > 17.85) autoProvince = 'Ilocos Norte';
        else if (lat > 16.95) autoProvince = 'Ilocos Sur';
        else if (lat > 16.25) autoProvince = 'La Union';

        if (autoProvince !== user?.province) {
          alert(`You can only map stations inside your assigned province (${user?.province}). Selected coordinates map to ${autoProvince}.`);
          return;
        }
      }
    }

    if (isProvincialUser) {
      if (formData.province !== user?.province) {
        alert(`Provincial users can only manage stations in their assigned province (${user?.province}).`);
        return;
      }

      // Also validate coordinates belong to their province
      const lat = parseFloat(formData.latitude);
      if (!isNaN(lat)) {
        let autoProvince = 'Pangasinan';
        if (lat > 17.85) autoProvince = 'Ilocos Norte';
        else if (lat > 16.95) autoProvince = 'Ilocos Sur';
        else if (lat > 16.25) autoProvince = 'La Union';

        if (autoProvince !== user?.province) {
          alert(`You can only map stations inside your assigned province (${user?.province}). Selected coordinates map to ${autoProvince}.`);
          return;
        }
      }
    }

    try {
      const payload = {
        ...formData,
        equipment_details: Object.keys(formData.equipment).reduce((acc, key) => {
           const eq = formData.equipment[key];
           if (eq.active) {
             let baseEq = {};
             if (key === 'evac') {
               baseEq = {
                 manual: true,
                 max_capacity_families: eq.max_capacity_families,
                 current_families: eq.current_families,
                 cooling_areas: eq.cooling_areas,
                 mobile_kitchen: eq.mobile_kitchen,
                 mobile_water: eq.mobile_water,
                 first_aid: eq.first_aid,
                 officer: eq.officer,
                 contact: eq.contact
               };
             } else if (key === 'warehouse') {
               baseEq = {
                 manual: true,
                 ffps_count: eq.ffps_count,
                 ready_to_eat_count: eq.ready_to_eat_count,
                 sleeping_kits_count: eq.sleeping_kits_count,
                 mats_count: eq.mats_count,
                 standby_funds: eq.standby_funds,
                 trucks_count: eq.trucks_count,
                 command_centers: eq.command_centers,
                 manager: eq.manager,
                 contact: eq.contact
               };
             } else {
               baseEq = { manual: true, brand: eq.brand, model: eq.model };
               if (key === 'aws' || key === 'arg') {
                 const existingStation = editingId ? stations.find(s => s.id === editingId) : null;
                 const existingEq = existingStation?.equipment_details?.[key];
                 baseEq.davis_did = eq.davis_did === 'OCCUPIED' ? (existingEq?.davis_did || '') : (eq.davis_did || '');
                 baseEq.davis_password = eq.davis_password === 'OCCUPIED' ? (existingEq?.davis_password || '') : (eq.davis_password || '');
                 baseEq.davis_api_token = eq.davis_api_token === 'OCCUPIED' ? (existingEq?.davis_api_token || '') : (eq.davis_api_token || '');
               }
             }
             acc[key] = baseEq;
           } else {
             acc[key] = null;
           }
           return acc;
        }, {})
      }
      if (editingId) await api.patch(`/stations/${editingId}`, payload)
      else await api.post('/stations', payload)
      
      fetchStations()
      resetForm()
      setIsDrawerOpen(false)
    } catch (err) { alert('Error saving station.') }
  }

  const resetForm = () => {
    setEditingId(null)
    const eq = {}
    EQUIPMENT_TYPES.forEach(t => {
      if (t.id === 'aws' || t.id === 'arg') {
        eq[t.id] = { active: false, brand: '', model: '', davis_did: '', davis_password: '', davis_api_token: '' }
      } else if (t.id === 'evac') {
        eq[t.id] = { active: false, max_capacity_families: '', current_families: '', cooling_areas: false, mobile_kitchen: false, mobile_water: false, first_aid: false, officer: '', contact: '' }
      } else if (t.id === 'warehouse') {
        eq[t.id] = { active: false, ffps_count: '', ready_to_eat_count: '', sleeping_kits_count: '', mats_count: '', standby_funds: '', trucks_count: '', command_centers: false, manager: '', contact: '' }
      } else {
        eq[t.id] = { active: false, brand: '', model: '' }
      }
    })
    setFormData({
      province: (isProvincialUser || isLguUser) ? (user?.province || 'Ilocos Norte') : 'Ilocos Norte',
      lgu: isLguUser ? (user?.city || '') : '',
      address: '', latitude: '', longitude: '', photo_url: '',
      equipment: eq
    })
  }

  // Safe helper to extract metrics from WeatherLink API response (checking root or nested)
  const getMetric = (data, keys) => {
    if (!data) return undefined;
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== 'N/A') {
        const val = parseFloat(data[key]);
        if (!isNaN(val)) return val;
      }
      if (data.davis_current_observation && data.davis_current_observation[key] !== undefined && data.davis_current_observation[key] !== null && data.davis_current_observation[key] !== 'N/A') {
        const val = parseFloat(data.davis_current_observation[key]);
        if (!isNaN(val)) return val;
      }
    }
    return undefined;
  };

  const getParsedTemp = () => {
    let result = 'N/A';
    if (liveData) {
      const tempC = getMetric(liveData, ['temp_c', 'temp_out_c', 'temp_in_c']);
      if (tempC !== undefined) result = `${tempC.toFixed(1)}°C`;
      else {
        const tempF = getMetric(liveData, ['temp_f', 'temp_out_f', 'temp_in_f']);
        if (tempF !== undefined) result = `${((tempF - 32) * 5 / 9).toFixed(1)}°C`;
      }
    }
    if (result === 'N/A' && simulatedWeather) {
      result = `${simulatedWeather.temp_c.toFixed(1)}°C`;
    }
    return result;
  };

  const getParsedRain = () => {
    let result = '0.0 mm/h';
    if (liveData) {
      const rainMm = getMetric(liveData, ['rain_rate_mm_per_hr', 'rain_rate_mm']);
      if (rainMm !== undefined) result = `${rainMm.toFixed(1)} mm/h`;
      else {
        const rainIn = getMetric(liveData, ['rain_rate_in_per_hr', 'rain_rate_in', 'rain_rate']);
        if (rainIn !== undefined) result = `${(rainIn * 25.4).toFixed(1)} mm/h`;
      }
    }
    if ((result === '0.0 mm/h' || result === 'N/A') && simulatedWeather) {
      result = `${simulatedWeather.rain_rate_mm.toFixed(1)} mm/h`;
    }
    return result;
  };

  const getParsedWind = () => {
    let result = 'N/A';
    if (liveData) {
      const windKph = getMetric(liveData, ['wind_kph', 'wind_speed']);
      if (windKph !== undefined) result = `${windKph.toFixed(1)} kph`;
      else {
        const windMph = getMetric(liveData, ['wind_mph']);
        if (windMph !== undefined) result = `${(windMph * 1.60934).toFixed(1)} kph`;
        else {
          const windKt = getMetric(liveData, ['wind_kt']);
          if (windKt !== undefined) result = `${(windKt * 1.852).toFixed(1)} kph`;
        }
      }
    }
    if (result === 'N/A' && simulatedWeather) {
      result = `${simulatedWeather.wind_kph.toFixed(1)} kph`;
    }
    return result;
  };

  const getParsedHumidity = () => {
    let result = 'N/A';
    if (liveData) {
      const humidity = getMetric(liveData, ['relative_humidity', 'relative_humidity_out', 'relative_humidity_in', 'humidity']);
      if (humidity !== undefined) result = `${Math.round(humidity)}%`;
    }
    if (result === 'N/A' && simulatedWeather) {
      result = `${simulatedWeather.relative_humidity}%`;
    }
    return result;
  };

  const getFormattedUpdatedTime = () => {
    if (!lastUpdatedTime) return 'Just now';
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const timeStr = lastUpdatedTime.toLocaleTimeString(undefined, timeOptions);
    const seconds = Math.floor((new Date() - lastUpdatedTime) / 1000);
    if (seconds < 5) return `Today at ${timeStr} (Just now)`;
    if (seconds < 60) return `Today at ${timeStr} (${seconds}s ago)`;
    const minutes = Math.floor(seconds / 60);
    return `Today at ${timeStr} (${minutes}m ago)`;
  };

  const filteredStations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const selProv = (typeof selectedProvince === 'string' ? selectedProvince : (selectedProvince?.target?.value || 'All')).toLowerCase().trim();
    return stations.filter(station => {
      const lat = parseFloat(station.latitude);
      const lng = parseFloat(station.longitude);
      if (isNaN(lat) || isNaN(lng)) return false;
      const p = (station.province || '').toLowerCase().trim();
      const matchesProvince = selProv === 'all' || p === selProv;
      const matchesSearch = !q || (station.lgu || '').toLowerCase().includes(q) || (station.address || '').toLowerCase().includes(q);
      const matchesEquipment = !selectedEquipmentFilter || !!station.equipment_details?.[selectedEquipmentFilter];
      return matchesProvince && matchesSearch && matchesEquipment;
    });
  }, [stations, searchQuery, selectedProvince, selectedEquipmentFilter])

  if (loading) return <LoadingSpinner fullPage message="Plotting Regional Ready Map..." />

  return (
    <div className="interactive-map-page">
      <div className="map-container-wrapper">
        <MapContainer 
          center={[16.8, 120.5]} zoom={8} minZoom={6} zoomControl={false}
          maxBounds={PH_OUTER_BOUNDS} maxBoundsViscosity={1.0} attributionControl={false}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
        >
          <MapEventsHandler onMapClick={handleMapClick} isMarking={isMarking} onZoomEnd={setZoom} />
          <ZoomControl position="bottomright" />
          <LayersControl position="bottomright">
            <LayersControl.BaseLayer checked name="Standard">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            </LayersControl.BaseLayer>
          </LayersControl>
          <Polygon positions={WORLD_MASK} pathOptions={{ fillColor: '#0f172a', fillOpacity: 0.85, color: '#1e293b', weight: 1, pointerEvents: 'none' }} />

          {filteredStations.map(station => {
            const activeKeys = Object.keys(station.equipment_details || {}).filter(key => !!station.equipment_details[key]);
            const activeCount = activeKeys.length;
            
            let iconToUse = ActiveStationIcon;
            if (activeCount >= 2) {
              iconToUse = MultiDeviceIcon;
            } else if (activeCount === 1) {
              if (activeKeys[0] === 'evac') {
                iconToUse = EvacCenterIcon;
              } else if (activeKeys[0] === 'warehouse') {
                iconToUse = ReliefWarehouseIcon;
              }
            }
            return (
              <Marker key={station.id} position={[parseFloat(station.latitude), parseFloat(station.longitude)]} icon={iconToUse || undefined}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div style={{ fontWeight: 'bold' }}>{station.lgu}</div>
                  <div style={{ fontSize: '0.7rem' }}>{station.province}</div>
                </Tooltip>
                <Popup className="custom-station-popup">
                  {station.photo_url && (
                    <div className="popup-photo-container">
                      <img src={resolvePdfUrl(station.photo_url)} alt={station.lgu} className="popup-photo" />
                    </div>
                  )}
                  <div className="station-popup-header">
                     <h3>{station.lgu}</h3>
                     {canEditStation(station) && (
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <button onClick={() => handleEdit(station)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="Edit"><Pencil size={14} /></button>
                         <button onClick={() => handleDelete(station.id)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} title="Delete"><Trash size={14} /></button>
                       </div>
                     )}
                  </div>
                  <div className="station-popup-body">
                    <div className="station-info-row">
                      <span className="station-info-label">Province</span>
                      <span className="station-info-value">{station.province}</span>
                    </div>
                    {station.address && (
                      <div className="station-info-row">
                        <span className="station-info-label">Address</span>
                        <span className="station-info-value">{station.address}</span>
                      </div>
                    )}
                    <div className="equipment-list">
                      <span className="station-info-label">Inventory Details</span>
                      <div className="equipment-grid">
                        {EQUIPMENT_TYPES.map(type => {
                          const val = station.equipment_details?.[type.id];
                          return val ? (
                            <div key={type.id} className="equipment-card" onClick={() => setActiveEquipmentDetail({ type, val, station })}>
                              <div className="equipment-card-header">
                                <div className="equipment-card-dot"></div>
                                <span className="equipment-card-label">{type.label}</span>
                              </div>
                              {type.id === 'evac' && (
                                <div className="equipment-card-details">
                                  <div className="equipment-detail-text">
                                    Capacity: {val.max_capacity_families || 'N/A'} Fam
                                  </div>
                                  <div className="equipment-detail-text">
                                    Occupied: {val.current_families || 0} Fam
                                  </div>
                                </div>
                              )}
                              {type.id === 'warehouse' && (
                                <div className="equipment-card-details">
                                  <div className="equipment-detail-text">
                                    FFPs: {val.ffps_count || 0} packs
                                  </div>
                                  <div className="equipment-detail-text">
                                    Funds: {val.standby_funds || 'N/A'}
                                  </div>
                                </div>
                              )}
                              {type.id !== 'evac' && type.id !== 'warehouse' && (val.brand || val.model) && (
                                <div className="equipment-card-details">
                                  {val.brand && (
                                    <div className="equipment-detail-text">
                                      <Tag size={8} style={{ marginRight: '2px' }} /> {val.brand}
                                    </div>
                                  )}
                                  {val.model && (
                                    <div className="equipment-detail-text">
                                      <Package size={8} style={{ marginRight: '2px' }} /> {val.model}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div className="map-overlay-title-card">
        <h2>Region I Ready Map</h2>
      </div>

      <div className="map-overlay-controls">
        <div className="map-controls-row">
          <div className="map-province-filter">
            <SearchableSelect options={['All', ...PROVINCES]} value={selectedProvince} onChange={(e) => setSelectedProvince(e?.target?.value || e)} placeholder="Filter Province" />
          </div>
          <div className="map-search-box">
            <SearchInput placeholder="Search stations..." value={searchQuery} onChange={(val) => setSearchSearchQuery(val)} />
          </div>
        </div>

        {/* Search Results / Filter Active Indicator */}
        {(searchQuery || selectedProvince !== 'All' || selectedEquipmentFilter) && (
          <div className="map-search-validation" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', marginTop: '0.25rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Info size={14} color="#3b82f6" />
            <span>
              Found <strong>{filteredStations.length}</strong> station(s)
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedProvince !== 'All' && ` in ${selectedProvince}`}
              {selectedEquipmentFilter && ` with ${selectedEquipmentFilter.toUpperCase()}`}
            </span>
          </div>
        )}

        {/* Equipment Inventory Filter Pills */}
        <div className="equipment-filters-row">
          {EQUIPMENT_TYPES.map(type => {
            const isActive = selectedEquipmentFilter === type.id;
            return (
              <button
                key={type.id}
                type="button"
                className={`equipment-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedEquipmentFilter(isActive ? null : type.id)}
              >
                <span className="pill-indicator"></span>
                {type.label}
              </button>
            );
          })}
          {selectedEquipmentFilter && (
            <button 
              type="button" 
              className="equipment-filter-clear-btn" 
              onClick={() => setSelectedEquipmentFilter(null)}
            >
              Clear Filter
            </button>
          )}
        </div>

        {canAddStation && (
          <button className="map-add-btn" onClick={() => { resetForm(); setIsDrawerOpen(true); }}><Plus size={28} weight="bold" /></button>
        )}
      </div>

      <div className="map-overlay-legend">
        <span className="legend-title">System Legend</span>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#3b82f6' }}></div><span>Active Station</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><House size={8} weight="bold" color="white" /></div><span>Evac Center</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Warehouse size={8} weight="bold" color="white" /></div><span>Relief Warehouse</span></div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Stack size={6} weight="bold" color="white" /></div><span>Multi-Device Node</span></div>
      </div>

      <aside className={`map-entry-drawer ${!isDrawerOpen ? 'closed' : ''}`}>
        <div className="drawer-header">
          <h3 className="drawer-title">{editingId ? 'Update Station' : 'New Monitoring Station'}</h3>
          <button className="drawer-close-btn" onClick={() => { resetForm(); setIsDrawerOpen(false); }}><X size={20} weight="bold" /></button>
        </div>
        <div className="drawer-content">
          <form className="manual-add-form" onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Province</label>
              <select className="drawer-input" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} disabled={isProvincialUser || isLguUser}>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">LGU Name</label>
              <input className="drawer-input" placeholder="e.g. LGU Adams" value={formData.lgu} required onChange={e => setFormData({...formData, lgu: e.target.value})} disabled={isLguUser} />
            </div>
            <div className="form-group">
              <label className="form-label">Station Photo</label>
              <div className="photo-upload-zone" onClick={() => fileInputRef.current.click()}>
                {formData.photo_url ? (
                  <img src={resolvePdfUrl(formData.photo_url)} alt="Preview" className="photo-preview-img" />
                ) : (
                  <>
                    {uploading ? <LoadingSpinner size="sm" /> : <Camera size={32} color="#94a3b8" />}
                    <span className="photo-upload-label">{uploading ? 'Uploading...' : 'Click to Upload Photo'}</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Coordinates</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input className="drawer-input" placeholder="Lat" value={formData.latitude} required onChange={e => setFormData({...formData, latitude: e.target.value})} />
                <input className="drawer-input" placeholder="Lng" value={formData.longitude} required onChange={e => setFormData({...formData, longitude: e.target.value})} />
              </div>
              <Button type="button" size="sm" variant={isMarking ? 'primary' : 'outline'} onClick={() => setIsMarking(!isMarking)} leftIcon={<MapPin />} style={{ marginTop: '0.75rem', width: '100%', borderRadius: '12px' }}>
                {isMarking ? 'Click on map...' : 'Pick from map'}
              </Button>
            </div>
            <div className="form-group">
              <label className="form-label">Equipment Inventory</label>
              <div className="inventory-grid">
                {EQUIPMENT_TYPES.map(type => {
                  const isActive = formData.equipment[type.id].active;
                  const isAnyFacActive = formData.equipment.evac.active || formData.equipment.warehouse.active;
                  const isReceded = isAnyFacActive && !isActive && (type.id === 'evac' || type.id === 'warehouse');
                  return (
                    <div 
                      key={type.id} 
                      className={`inventory-item 
                        ${isActive ? 'active' : ''} 
                        ${isActive && type.id === 'evac' ? 'active-amber' : ''} 
                        ${isActive && type.id === 'warehouse' ? 'active-purple' : ''} 
                        ${isActive && type.id !== 'evac' && type.id !== 'warehouse' ? 'active-blue' : ''} 
                        ${isReceded ? 'receded' : ''}
                      `}
                    >
                      <label className="pill-toggle" style={{ marginBottom: isActive ? '1rem' : '0' }}>
                        <input 
                          type="checkbox" 
                          checked={isActive} 
                          onChange={e => setFormData({
                            ...formData, 
                            equipment: {
                              ...formData.equipment, 
                              [type.id]: { ...formData.equipment[type.id], active: e.target.checked }
                            }
                          })} 
                        />
                        <div className="pill-label">{type.label}</div>
                      </label>
                    
                    {formData.equipment[type.id].active && (
                      <>
                        {type.id === 'evac' && (
                          <div className="inventory-details-container evac-form">
                            <div className="form-section-title">Available Amenities</div>
                            <div className="inventory-detail-field" style={{ marginBottom: '1.25rem' }}>
                              <div className="checkbox-options-grid">
                                {[
                                  { label: 'Air-Cooling / AC Units', key: 'cooling_areas' },
                                  { label: 'Mobile Kitchen Standby', key: 'mobile_kitchen' },
                                  { label: 'Mobile Water Station', key: 'mobile_water' },
                                  { label: 'First Aid Station', key: 'first_aid' }
                                ].map(opt => (
                                  <label key={opt.key} className="checkbox-option-item">
                                    <input 
                                      type="checkbox" 
                                      checked={!!formData.equipment.evac[opt.key]}
                                      onChange={e => setFormData({
                                        ...formData,
                                        equipment: {
                                          ...formData.equipment,
                                          evac: { ...formData.equipment.evac, [opt.key]: e.target.checked }
                                        }
                                      })}
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="form-section-title">Capacity & Contact Details</div>
                            <div className="form-row-2">
                              <div className="inventory-detail-field">
                                <label className="sub-label">Max Capacity (Families)</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="200" 
                                  value={formData.equipment.evac.max_capacity_families || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      evac: { ...formData.equipment.evac, max_capacity_families: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="inventory-detail-field">
                                <label className="sub-label">Occupancy (Families)</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="45" 
                                  value={formData.equipment.evac.current_families || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      evac: { ...formData.equipment.evac, current_families: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                            
                            <div className="form-row-2">
                              <div className="inventory-detail-field">
                                <label className="sub-label">Officer In Charge</label>
                                <input 
                                  type="text" 
                                  className="drawer-input" 
                                  placeholder="Officer Name" 
                                  value={formData.equipment.evac.officer || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      evac: { ...formData.equipment.evac, officer: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="inventory-detail-field">
                                <label className="sub-label">Contact Number</label>
                                <input 
                                  type="text" 
                                  className="drawer-input" 
                                  placeholder="Contact No." 
                                  value={formData.equipment.evac.contact || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      evac: { ...formData.equipment.evac, contact: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {type.id === 'warehouse' && (
                          <div className="inventory-details-container warehouse-form">
                            <div className="form-section-title">Prepositioned Stockpiles</div>
                            <div className="form-row-2">
                              <div className="inventory-detail-field">
                                <label className="sub-label">Food Packs (FFPs)</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="5000" 
                                  value={formData.equipment.warehouse.ffps_count || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, ffps_count: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="inventory-detail-field">
                                <label className="sub-label">Ready-to-Eat Food</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="1200" 
                                  value={formData.equipment.warehouse.ready_to_eat_count || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, ready_to_eat_count: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                            <div className="form-row-2">
                              <div className="inventory-detail-field">
                                <label className="sub-label">Sleeping Kits</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="800" 
                                  value={formData.equipment.warehouse.sleeping_kits_count || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, sleeping_kits_count: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="inventory-detail-field">
                                <label className="sub-label">Plastic Mats</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="1500" 
                                  value={formData.equipment.warehouse.mats_count || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, mats_count: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div className="form-section-title">Standby Funds & Assets</div>
                            <div className="form-row-2">
                              <div className="inventory-detail-field">
                                <label className="sub-label">Standby Funds (PHP)</label>
                                <input 
                                  type="text" 
                                  className="drawer-input" 
                                  placeholder="1,210,000,000" 
                                  value={formData.equipment.warehouse.standby_funds || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, standby_funds: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="inventory-detail-field">
                                <label className="sub-label">Dispatch Trucks</label>
                                <input 
                                  type="number" 
                                  className="drawer-input" 
                                  placeholder="5" 
                                  value={formData.equipment.warehouse.trucks_count || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, trucks_count: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div className="inventory-detail-field" style={{ marginBottom: '1.25rem', marginTop: '0.25rem' }}>
                              <label className="checkbox-option-item">
                                <input 
                                  type="checkbox" 
                                  checked={!!formData.equipment.warehouse.command_centers}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, command_centers: e.target.checked }
                                    }
                                  })}
                                />
                                <span>Mobile Command Center Standby</span>
                              </label>
                            </div>

                            <div className="form-section-title">Management Contact</div>
                            <div className="form-row-2">
                              <div className="inventory-detail-field">
                                <label className="sub-label">Warehouse Manager</label>
                                <input 
                                  type="text" 
                                  className="drawer-input" 
                                  placeholder="Manager Name" 
                                  value={formData.equipment.warehouse.manager || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, manager: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                              <div className="inventory-detail-field">
                                <label className="sub-label">Contact Number</label>
                                <input 
                                  type="text" 
                                  className="drawer-input" 
                                  placeholder="Contact No." 
                                  value={formData.equipment.warehouse.contact || ''}
                                  onChange={e => setFormData({
                                    ...formData,
                                    equipment: {
                                      ...formData.equipment,
                                      warehouse: { ...formData.equipment.warehouse, contact: e.target.value }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {type.id !== 'evac' && type.id !== 'warehouse' && (
                          <div className="inventory-details-container">
                            <div className="inventory-detail-field">
                              <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Brand</label>
                              <input 
                                className="drawer-input" 
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                placeholder="Brand" 
                                value={formData.equipment[type.id].brand}
                                onChange={e => setFormData({
                                  ...formData,
                                  equipment: {
                                    ...formData.equipment,
                                    [type.id]: { ...formData.equipment[type.id], brand: e.target.value }
                                  }
                                })}
                              />
                            </div>
                            <div className="inventory-detail-field">
                              <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Model</label>
                              <input 
                                className="drawer-input" 
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                placeholder="Model" 
                                value={formData.equipment[type.id].model}
                                onChange={e => setFormData({
                                  ...formData,
                                  equipment: {
                                    ...formData.equipment,
                                    [type.id]: { ...formData.equipment[type.id], model: e.target.value }
                                  }
                                })}
                              />
                            </div>
                            {(type.id === 'aws' || type.id === 'arg') && (
                              <>
                                <div className="inventory-detail-field">
                                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Device ID (DID)</label>
                                  <input 
                                    className="drawer-input" 
                                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                    placeholder="Device ID (DID)" 
                                    value={formData.equipment[type.id].davis_did || ''}
                                    onChange={e => setFormData({
                                      ...formData,
                                      equipment: {
                                        ...formData.equipment,
                                        [type.id]: { ...formData.equipment[type.id], davis_did: e.target.value }
                                      }
                                    })}
                                  />
                                </div>
                                <div className="inventory-detail-field">
                                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Account Password</label>
                                  <input 
                                    type="password"
                                    className="drawer-input" 
                                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                    placeholder="Account Password" 
                                    value={formData.equipment[type.id].davis_password || ''}
                                    onChange={e => setFormData({
                                      ...formData,
                                      equipment: {
                                        ...formData.equipment,
                                        [type.id]: { ...formData.equipment[type.id], davis_password: e.target.value }
                                      }
                                    })}
                                  />
                                </div>
                                <div className="inventory-detail-field">
                                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>API Token</label>
                                  <input 
                                    className="drawer-input" 
                                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                                    placeholder="API Token" 
                                    value={formData.equipment[type.id].davis_api_token || ''}
                                    onChange={e => setFormData({
                                      ...formData,
                                      equipment: {
                                        ...formData.equipment,
                                        [type.id]: { ...formData.equipment[type.id], davis_api_token: e.target.value }
                                      }
                                    })}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )})}
              </div>
            </div>
            <Button type="submit" variant="primary" style={{ marginTop: '1.5rem', height: '54px', borderRadius: '16px' }}>{editingId ? 'Update Station' : 'Save Station'}</Button>
          </form>
        </div>
      </aside>

      {activeEquipmentDetail && (
        <div 
          className="equipment-detail-overlay"
          style={{ 
            transform: `translate(calc(-50% + ${modalPos.x}px), calc(-50% + ${modalPos.y}px))`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div className="equipment-detail-header" onMouseDown={handleMouseDown} style={{ cursor: isDragging ? 'grabbing' : 'grab' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h4>{activeEquipmentDetail.type.label}</h4>
              {canEditStation(activeEquipmentDetail.station) && (
                <button 
                  onClick={() => setIsEditingDetail(!isEditingDetail)} 
                  onMouseDown={e => e.stopPropagation()}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {isEditingDetail ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>
            <button className="equipment-detail-close" onClick={() => setActiveEquipmentDetail(null)} onMouseDown={e => e.stopPropagation()}><X size={16} weight="bold" /></button>
          </div>
          <div className="equipment-detail-body">
            {(activeEquipmentDetail.type.id === 'aws' || activeEquipmentDetail.type.id === 'arg') && (
              <div className="live-feed-section">
                <div className="live-feed-header">
                  <span className={`live-feed-dot ${(!activeEquipmentDetail.val.davis_did || !activeEquipmentDetail.val.davis_password) ? 'demo' : 'animate-pulse'}`}></span>
                  <span className="live-feed-title">
                    {(!activeEquipmentDetail.val.davis_did || !activeEquipmentDetail.val.davis_password) 
                      ? (user ? `LIVE FEED (${user.first_name || user.email})` : 'LIVE FEED (GUEST)') 
                      : `LIVE FEED (${activeEquipmentDetail.val.davis_did})`}
                  </span>
                </div>
                <div className="live-feed-content">
                  {liveLoading && (
                    <div className="live-feed-status">
                      <div className="live-spinner"></div>
                      <span>Connecting to Davis Instruments API...</span>
                    </div>
                  )}
                  {liveError && (
                    <div className="live-feed-error">
                      <Warning size={16} color="#ef4444" />
                      <span>{liveError}</span>
                    </div>
                  )}
                  {(liveData || simulatedWeather) && (
                    <div className="live-feed-metrics">
                      <div className="metric-box">
                        <span className="metric-label">Temperature</span>
                        <span className="metric-value">
                          {getParsedTemp()}
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Rainfall Rate</span>
                        <span className="metric-value">
                          {getParsedRain()}
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Wind Speed</span>
                        <span className="metric-value">
                          {getParsedWind()}
                        </span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-label">Humidity</span>
                        <span className="metric-value">
                          {getParsedHumidity()}
                        </span>
                      </div>
                      <div className="live-feed-footer">
                        <span>Updated: {getFormattedUpdatedTime()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeEquipmentDetail.type.id === 'evac' && (
              <div className="custom-detail-view evac-detail-view">
                {isEditingDetail ? (
                  <div className="custom-edit-form">
                    <div className="detail-row">
                      <span className="detail-label">Max Capacity (Families)</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.max_capacity_families || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, max_capacity_families: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Current Occupancy (Families)</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.current_families || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, current_families: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Officer in Charge</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.officer || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, officer: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Contact Number</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.contact || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, contact: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Available Amenities</span>
                      <div className="checkbox-options-grid" style={{ marginTop: '0.25rem' }}>
                        {[
                          { label: 'Air-Cooling / AC Units', key: 'cooling_areas' },
                          { label: 'Mobile Kitchen Standby', key: 'mobile_kitchen' },
                          { label: 'Mobile Water Station', key: 'mobile_water' },
                          { label: 'First Aid Station', key: 'first_aid' }
                        ].map(opt => (
                          <label key={opt.key} className="checkbox-option-item" style={{ color: 'white' }}>
                            <input 
                              type="checkbox" 
                              checked={!!detailEditData[opt.key]}
                              onChange={e => setDetailEditData({ ...detailEditData, [opt.key]: e.target.checked })}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Coverage Area</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.coverage || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, coverage: e.target.value })} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="custom-view-panels">
                    <div className="evac-occupancy-card">
                      <div className="occupancy-stats">
                        <span className="occupancy-large">{activeEquipmentDetail.val.current_families || 0}</span>
                        <span className="occupancy-separator">/</span>
                        <span className="occupancy-max">{activeEquipmentDetail.val.max_capacity_families || 'N/A'}</span>
                        <span className="occupancy-unit">Families Occupied</span>
                      </div>
                      {activeEquipmentDetail.val.max_capacity_families && (
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${Math.min(100, (parseFloat(activeEquipmentDetail.val.current_families || 0) / parseFloat(activeEquipmentDetail.val.max_capacity_families)) * 100)}%`,
                              background: (parseFloat(activeEquipmentDetail.val.current_families || 0) / parseFloat(activeEquipmentDetail.val.max_capacity_families)) > 0.85 ? '#ef4444' : '#f59e0b'
                            }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="detail-panel-section">
                      <span className="detail-section-title">Available Amenities & Assets</span>
                      <div className="amenities-badge-list">
                        {[
                          { label: 'Air-Cooling / AC Units', key: 'cooling_areas' },
                          { label: 'Mobile Kitchen Standby', key: 'mobile_kitchen' },
                          { label: 'Mobile Water Station', key: 'mobile_water' },
                          { label: 'First Aid Station', key: 'first_aid' }
                        ].map(opt => {
                          const active = !!activeEquipmentDetail.val[opt.key];
                          return (
                            <div key={opt.key} className={`amenity-badge ${active ? 'active' : 'inactive'}`}>
                              <CheckCircle size={12} weight={active ? 'fill' : 'bold'} />
                              <span>{opt.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="detail-panel-section info-card-bg" style={{ marginTop: '1rem' }}>
                      <div className="info-card-row">
                        <span className="info-card-label">Officer in Charge</span>
                        <span className="info-card-val">{activeEquipmentDetail.val.officer || 'N/A'}</span>
                      </div>
                      <div className="info-card-row">
                        <span className="info-card-label">Contact Number</span>
                        <span className="info-card-val">{activeEquipmentDetail.val.contact || 'N/A'}</span>
                      </div>
                      <div className="info-card-row">
                        <span className="info-card-label">Coverage Area</span>
                        <span className="info-card-val">{activeEquipmentDetail.val.coverage || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeEquipmentDetail.type.id === 'warehouse' && (
              <div className="custom-detail-view warehouse-detail-view">
                {isEditingDetail ? (
                  <div className="custom-edit-form">
                    <span className="detail-section-title">Stockpile Counts</span>
                    <div className="detail-row">
                      <span className="detail-label">Family Food Packs (FFPs)</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.ffps_count || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, ffps_count: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Ready-to-Eat Food Box</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.ready_to_eat_count || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, ready_to_eat_count: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Sleeping Kits</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.sleeping_kits_count || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, sleeping_kits_count: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Plastic Mats</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.mats_count || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, mats_count: e.target.value })} 
                      />
                    </div>
                    <span className="detail-section-title" style={{ marginTop: '1rem' }}>Funds & Rapid Assets</span>
                    <div className="detail-row">
                      <span className="detail-label">Standby Funds (PHP)</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.standby_funds || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, standby_funds: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Prepositioned Trucks</span>
                      <input 
                        type="number" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.trucks_count || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, trucks_count: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <label className="checkbox-option-item" style={{ color: 'white', marginTop: '0.25rem' }}>
                        <input 
                          type="checkbox" 
                          checked={!!detailEditData.command_centers}
                          onChange={e => setDetailEditData({ ...detailEditData, command_centers: e.target.checked })}
                        />
                        <span>Mobile Command Center Standby</span>
                      </label>
                    </div>
                    <span className="detail-section-title" style={{ marginTop: '1rem' }}>Management Contact</span>
                    <div className="detail-row">
                      <span className="detail-label">Warehouse Manager</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.manager || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, manager: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Contact Number</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.contact || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, contact: e.target.value })} 
                      />
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Coverage Area</span>
                      <input 
                        type="text" 
                        className="drawer-input detail-edit-input" 
                        value={detailEditData.coverage || ''} 
                        onChange={e => setDetailEditData({ ...detailEditData, coverage: e.target.value })} 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="custom-view-panels">
                    <div className="detail-panel-section">
                      <span className="detail-section-title">Prepositioned Stockpiles</span>
                      <div className="stockpile-grid">
                        {[
                          { label: 'Family Food Packs (FFPs)', val: activeEquipmentDetail.val.ffps_count, unit: 'packs', color: '#3b82f6' },
                          { label: 'Ready-to-Eat Food', val: activeEquipmentDetail.val.ready_to_eat_count, unit: 'boxes', color: '#10b981' },
                          { label: 'Sleeping Kits', val: activeEquipmentDetail.val.sleeping_kits_count, unit: 'kits', color: '#8b5cf6' },
                          { label: 'Plastic Mats', val: activeEquipmentDetail.val.mats_count, unit: 'pcs', color: '#f59e0b' }
                        ].map(item => (
                          <div key={item.label} className="stockpile-card" style={{ borderLeftColor: item.color }}>
                            <span className="stockpile-label">{item.label}</span>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                              <span className="stockpile-val">{item.val || 0}</span>
                              <span className="stockpile-unit">{item.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="funds-prepositioned-banner" style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="banner-title">Standby Funds</span>
                        <span className="banner-value">{activeEquipmentDetail.val.standby_funds || 'P0.00'}</span>
                      </div>
                    </div>

                    <div className="detail-panel-section" style={{ marginTop: '1.25rem' }}>
                      <span className="detail-section-title">Standby Rapid Assets</span>
                      <div className="asset-status-row">
                        <div className="asset-status-item">
                          <span className="asset-count">{activeEquipmentDetail.val.trucks_count || 0}</span>
                          <span className="asset-label">Dispatch Trucks</span>
                        </div>
                        <div className={`asset-status-item ${activeEquipmentDetail.val.command_centers ? 'active' : 'inactive'}`}>
                          <span className="asset-check-status">{activeEquipmentDetail.val.command_centers ? 'STANDBY' : 'NONE'}</span>
                          <span className="asset-label">Mobile Command</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-panel-section info-card-bg" style={{ marginTop: '1.25rem' }}>
                      <div className="info-card-row">
                        <span className="info-card-label">Warehouse Manager</span>
                        <span className="info-card-val">{activeEquipmentDetail.val.manager || 'N/A'}</span>
                      </div>
                      <div className="info-card-row">
                        <span className="info-card-label">Contact Number</span>
                        <span className="info-card-val">{activeEquipmentDetail.val.contact || 'N/A'}</span>
                      </div>
                      <div className="info-card-row">
                        <span className="info-card-label">Coverage Area</span>
                        <span className="info-card-val">{activeEquipmentDetail.val.coverage || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeEquipmentDetail.type.id !== 'evac' && activeEquipmentDetail.type.id !== 'warehouse' && (
              [
                { label: 'Model', key: 'model' },
                { label: 'Brand', key: 'brand' },
                { label: 'Specs', key: 'specs' },
                { label: 'Coverage', key: 'coverage' },
                { label: 'Coordinates', key: 'coordinates', disabled: true },
                { label: 'Local DRRM Officer', key: 'officer' },
                { label: 'Contact Number', key: 'contact' },
                ...(activeEquipmentDetail.type.id === 'aws' || activeEquipmentDetail.type.id === 'arg' ? [
                  { label: 'Device ID (DID)', key: 'davis_did' },
                  { label: 'Account Password', key: 'davis_password', isSecret: true },
                  { label: 'API Token', key: 'davis_api_token' }
                ] : [])
              ].map(field => (
                <div className="detail-row" key={field.key}>
                  <span className="detail-label">{field.label}</span>
                  {isEditingDetail && !field.disabled ? (
                    <input 
                      type={field.isSecret ? 'password' : 'text'}
                      className="drawer-input"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', marginTop: '0.25rem' }}
                      value={field.key === 'coordinates' ? `${activeEquipmentDetail.station.latitude}, ${activeEquipmentDetail.station.longitude}` : detailEditData[field.key]}
                      onChange={e => {
                        const val = e.target.value;
                        if (field.key === 'contact') {
                          // Allow only numbers and limit to 11 digits (standard PH mobile)
                          const numericVal = val.replace(/[^0-9]/g, '').slice(0, 11);
                          setDetailEditData({ ...detailEditData, [field.key]: numericVal });
                        } else {
                          setDetailEditData({ ...detailEditData, [field.key]: val });
                        }
                      }}
                    />
                  ) : (
                    <span className="detail-value">
                      {field.key === 'coordinates' 
                        ? `${activeEquipmentDetail.station.latitude}, ${activeEquipmentDetail.station.longitude}` 
                        : ['davis_did', 'davis_password', 'davis_api_token'].includes(field.key)
                          ? (activeEquipmentDetail.val[field.key] ? 'OCCUPIED' : 'N/A')
                          : (activeEquipmentDetail.val[field.key] || detailEditData[field.key] || 'N/A')}
                    </span>
                  )}
                </div>
              ))
            )}
            
            {isEditingDetail && (
              <Button 
                onClick={handleSaveDetail} 
                variant="primary" 
                size="sm" 
                style={{ marginTop: '0.5rem', width: '100%', borderRadius: '10px' }}
                leftIcon={<CheckCircle size={16} />}
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
