import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bus, 
  MapPin, 
  Navigation, 
  Clock, 
  Users, 
  Radio, 
  Compass, 
  ShieldCheck, 
  PlusCircle, 
  CheckCircle2, 
  LocateFixed, 
  Loader2, 
  RotateCw, 
  Ticket, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  TrendingUp, 
  Phone, 
  AlertCircle,
  Eye
} from 'lucide-react';
import L from 'leaflet';
import { 
  KARNATAKA_LOCATIONS, 
  calculateDistance, 
  calculateSystemFare, 
  generateStopsForTime, 
  formatTime 
} from '../data/karnatakaRoutes';
import { 
  createTravelTrip, 
  fetchTravelTrips, 
  updateTripLiveLocation, 
  fetchTripBookings 
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function TravelsDashboard({ currentUser }) {
  const { language, t } = useLanguage();
  // Operator details from user or defaults
  const operatorName = currentUser?.name || 'Suresh Kumar';
  const operatorPhone = currentUser?.phone || '9845012345';
  const vehicleName = currentUser?.vehicleName || 'Force Cruiser Rural Maxi';
  const vehicleRegNo = currentUser?.vehicleRegNo || 'KA-21-E-4589';
  const seatingCapacity = currentUser?.seatingCapacity || 18;
  const operatorId = currentUser?.id || 'DEMO-TRAVELS-1';

  // State: List of operator trips
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  // State: Task / Trip Creation Form
  const [source, setSource] = useState('Kukke Subrahmanya');
  const [destination, setDestination] = useState('Dharmasthala');
  const [viaRoute, setViaRoute] = useState('NH-73 via Gundya, Kokkada & Ujire');
  const [departurePreset, setDeparturePreset] = useState('in15');
  const [customTime, setCustomTime] = useState('04:30 PM');
  const [totalSeats, setTotalSeats] = useState(seatingCapacity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState('');

  // State: Live Location Sharing for Active Trip
  const [isBroadcastingGps] = useState(true);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [currentSpeedKm, setCurrentSpeedKm] = useState(42);
  const [currentCheckpoint, setCurrentCheckpoint] = useState('Departed Terminal • On Highway NH-73');
  const [tripStatus, setTripStatus] = useState('Boarding');
  const [directionHeading, setDirectionHeading] = useState('North-West (315° NW)');
  const [isUpdatingTelemetry, setIsUpdatingTelemetry] = useState(false);
  const [telemetrySuccess, setTelemetrySuccess] = useState('');

  // State: Passenger Bookings for Active Trip
  const [tripBookings, setTripBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const busMarkerRef = useRef(null);

  // Dynamic calculations for the route form
  const srcObj = useMemo(() => {
    return KARNATAKA_LOCATIONS.find(l => l.name === source) || KARNATAKA_LOCATIONS[0];
  }, [source]);

  const destObj = useMemo(() => {
    return KARNATAKA_LOCATIONS.find(l => l.name === destination) || KARNATAKA_LOCATIONS[1];
  }, [destination]);

  const calculatedDistanceKm = useMemo(() => {
    return calculateDistance(srcObj.lat, srcObj.lng, destObj.lat, destObj.lng);
  }, [srcObj, destObj]);

  // System declares the official ticket amount based on state stage carriage tariff
  const systemDeclaredFare = useMemo(() => {
    return calculateSystemFare(calculatedDistanceKm, vehicleName);
  }, [calculatedDistanceKm, vehicleName]);

  // Auto-suggest via-route when source or destination changes
  useEffect(() => {
    if (srcObj && destObj) {
      if (srcObj.district === destObj.district) {
        setViaRoute(`State Highway corridor via local taluk link road`);
      } else {
        setViaRoute(`NH-73 / State Rural Express Link connecting ${srcObj.district} to ${destObj.district}`);
      }
    }
  }, [srcObj, destObj]);

  // Load Trips on Mount
  useEffect(() => {
    loadOperatorTrips();
  }, [operatorId]);

  const loadOperatorTrips = async () => {
    setIsLoadingTrips(true);
    try {
      const data = await fetchTravelTrips('', '', operatorId);
      setTrips(data);
      if (data.length > 0) {
        const current = data[0];
        setActiveTrip(current);
        if (current.liveLocation) {
          setCurrentSpeedKm(current.liveLocation.speedKm || 0);
          setCurrentCheckpoint(current.liveLocation.currentStop || `${current.source} Terminal`);
          setTripStatus(current.status || 'Ready to Depart');
          setDirectionHeading(current.liveLocation.direction || `Heading towards ${current.destination}`);
        }
      }
    } catch (err) {
      console.error('Failed to load trips', err);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  // Load bookings whenever activeTrip changes
  useEffect(() => {
    if (activeTrip) {
      loadBookingsForTrip(activeTrip.id);
    }
  }, [activeTrip]);

  const loadBookingsForTrip = async (tripId) => {
    setIsLoadingBookings(true);
    try {
      const bList = await fetchTripBookings(tripId);
      setTripBookings(bList);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Setup Leaflet map for activeTrip
  useEffect(() => {
    if (!activeTrip || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const tSrc = KARNATAKA_LOCATIONS.find(l => l.name === activeTrip.source) || KARNATAKA_LOCATIONS[0];
    const tDest = KARNATAKA_LOCATIONS.find(l => l.name === activeTrip.destination) || KARNATAKA_LOCATIONS[1];
    const busLat = activeTrip.liveLocation?.lat || tSrc.lat;
    const busLng = activeTrip.liveLocation?.lng || tSrc.lng;

    const map = L.map(mapContainerRef.current).setView([busLat, busLng], 10);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Draw route line
    const waypoints = [
      [tSrc.lat, tSrc.lng],
      [(tSrc.lat + tDest.lat) / 2 + 0.01, (tSrc.lng + tDest.lng) / 2 + 0.01],
      [tDest.lat, tDest.lng]
    ];

    const polyline = L.polyline(waypoints, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Origin marker
    const originIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #16a34a; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">S</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([tSrc.lat, tSrc.lng], { icon: originIcon })
      .bindPopup(`<strong>Origin:</strong> ${tSrc.name}`)
      .addTo(map);

    // Destination marker
    const destIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">D</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([tDest.lat, tDest.lng], { icon: destIcon })
      .bindPopup(`<strong>Destination:</strong> ${tDest.name}`)
      .addTo(map);

    // Bus Live Position marker
    const busIcon = L.divIcon({
      className: 'custom-bus-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; background-color: #3b82f6; opacity: 0.4; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background-color: #1e40af; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 10;">
            🚌
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const busMarker = L.marker([busLat, busLng], { icon: busIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px;">
          <div style="font-weight: bold; color: #1e3a8a;">${activeTrip.busName}</div>
          <div style="font-size: 11px; color: #475569;">Reg: ${activeTrip.vehicleRegNo}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 4px;">Status: ${activeTrip.status}</div>
          <div style="font-size: 11px; color: #0284c7;">Speed: ${activeTrip.liveLocation?.speedKm || 0} km/h</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Checkpoint: ${activeTrip.liveLocation?.currentStop || 'En Route'}</div>
        </div>
      `)
      .addTo(map);

    busMarkerRef.current = busMarker;
  }, [activeTrip]);

  // Handle Create Route Task
  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (source === destination) {
      alert('Starting location and destination cannot be the same. Please choose different points.');
      return;
    }

    setIsSubmitting(true);
    let departureTimeStr = customTime;
    if (departurePreset === 'in15') {
      const d = new Date(Date.now() + 15 * 60000);
      departureTimeStr = formatTime(d);
    } else if (departurePreset === 'in45') {
      const d = new Date(Date.now() + 45 * 60000);
      departureTimeStr = formatTime(d);
    }

    const payload = {
      operatorId,
      operatorName,
      operatorPhone,
      busName: `${operatorName.split(' ')[0]} Rural Express (${vehicleName})`,
      vehicleRegNo,
      busType: vehicleName,
      source,
      destination,
      viaRoute,
      departureTime: departureTimeStr,
      departureDate: 'Today',
      totalSeats: parseInt(totalSeats, 10) || 18,
      distanceKm: calculatedDistanceKm,
      initialLat: srcObj.lat,
      initialLng: srcObj.lng
    };

    try {
      const created = await createTravelTrip(payload);
      setTrips(prev => [created, ...prev]);
      setActiveTrip(created);
      setFormSuccessMessage(`Route task ${created.id} broadcasted! This bus is now visible on the Passenger Dashboard with system-declared fare of ₹${created.fare}.`);
      setIsSubmitting(false);

      setTimeout(() => {
        setFormSuccessMessage('');
      }, 4000);
    } catch (err) {
      alert('Error creating trip: ' + err.message);
      setIsSubmitting(false);
    }
  };

  // Acquire Live GPS from phone/browser
  const handleAcquireDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsAcquiringGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsAcquiringGps(false);
        const { latitude, longitude, speed } = pos.coords;
        const currentSpeed = speed ? Math.round(speed * 3.6) : 38;
        setCurrentSpeedKm(currentSpeed);

        if (activeTrip) {
          await broadcastTelemetryUpdate(latitude, longitude, currentSpeed);
        }
      },
      (err) => {
        console.warn('GPS error, using realistic corridor coordinates', err);
        setIsAcquiringGps(false);
        if (activeTrip && srcObj && destObj) {
          // Simulate midway on corridor
          const midLat = (srcObj.lat + destObj.lat) / 2;
          const midLng = (srcObj.lng + destObj.lng) / 2;
          broadcastTelemetryUpdate(midLat, midLng, 45);
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Broadcast Live Telemetry Update
  const broadcastTelemetryUpdate = async (overrideLat, overrideLng, overrideSpeed) => {
    if (!activeTrip) return;
    setIsUpdatingTelemetry(true);

    const tSrc = KARNATAKA_LOCATIONS.find(l => l.name === activeTrip.source) || KARNATAKA_LOCATIONS[0];
    const tDest = KARNATAKA_LOCATIONS.find(l => l.name === activeTrip.destination) || KARNATAKA_LOCATIONS[1];

    let lat = overrideLat !== undefined ? overrideLat : activeTrip.liveLocation?.lat || tSrc.lat;
    let lng = overrideLng !== undefined ? overrideLng : activeTrip.liveLocation?.lng || tSrc.lng;
    const speedKm = overrideSpeed !== undefined ? overrideSpeed : currentSpeedKm;

    // If moving between stops, interpolate slightly
    if (tripStatus === 'In Transit' && !overrideLat) {
      lat = (tSrc.lat * 0.4) + (tDest.lat * 0.6);
      lng = (tSrc.lng * 0.4) + (tDest.lng * 0.6);
    } else if (tripStatus === 'Ready to Depart') {
      lat = tSrc.lat;
      lng = tSrc.lng;
    }

    const payload = {
      lat,
      lng,
      speedKm,
      currentStop: currentCheckpoint,
      direction: directionHeading,
      status: tripStatus
    };

    try {
      const updated = await updateTripLiveLocation(activeTrip.id, payload);
      if (updated) {
        setActiveTrip(updated);
        setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
      }
      setTelemetrySuccess('Live telemetry broadcasted! Passengers see your real-time position.');
      setIsUpdatingTelemetry(false);

      setTimeout(() => {
        setTelemetrySuccess('');
      }, 3000);
    } catch (err) {
      alert('Failed to update telemetry: ' + err.message);
      setIsUpdatingTelemetry(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-900/80 border border-indigo-400/40 px-3 py-1 rounded-full text-xs font-semibold text-sky-300 mb-3">
              <Bus className="w-3.5 h-3.5 text-sky-300" />
              <span>{t('travelsTitle', 'Travels Operator Management Portal • Karnataka Rural Transit')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('travelsTitle', 'Route Tasks & Live Bus Telemetry')}
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1.5 leading-relaxed">
              {t('travelsWelcomeDesc', 'Define your trip schedule, choose your starting and ending points, broadcast your route to the Passenger Dashboard, and share your real-time GPS location while the system officially declares the ticket amount.')}
            </p>
          </div>

          {/* Operator Vehicle Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-xs space-y-2 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-sky-300 uppercase tracking-wider font-bold">{t('profile', 'Operator Profile')}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="font-extrabold text-sm text-white">{operatorName}</div>
            <div className="text-indigo-200 flex items-center space-x-2">
              <span className="font-bold text-white">{vehicleName}</span>
              <span>•</span>
              <span className="font-mono bg-blue-950/80 px-1.5 py-0.5 rounded text-[11px] text-sky-300 font-semibold">{vehicleRegNo}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-indigo-100">
              <span>{t('seatingCapacity', 'Seating')}: <strong>{seatingCapacity} {t('passengers', 'Passengers')}</strong></span>
              <span>GPS: <strong className="text-emerald-300">{t('liveGpsStatus', 'Broadcasting')}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid: Create Route Task (Left) + Active Trip Live Telemetry & Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Create Route Task (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <span>{t('createTripTask', 'Create Route Task & Broadcast Bus')}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mention your origin, destination, corridor route, and departure time.
            </p>
          </div>

          {formSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{formSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
            {/* 1. Origin & Destination */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>1. Starting Location (Origin) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Departure Terminal</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {KARNATAKA_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>2. Ending Location (Destination) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">Final Terminus</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-rose-600" />
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {KARNATAKA_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Corridor Route (In which route he is going) */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>3. In Which Route are You Going? <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-medium">Via Corridors / Stops</span>
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 absolute left-3 top-2.5 text-blue-500" />
                <input
                  type="text"
                  required
                  value={viaRoute}
                  onChange={(e) => setViaRoute(e.target.value)}
                  placeholder="e.g. NH-73 via Gundya, Kokkada & Ujire Bypass"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-medium text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Passengers along these intermediate stops can board your vehicle.
              </span>
            </div>

            {/* 3. Departure Schedule */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>4. Scheduled Departure Time <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-emerald-700 font-bold">Real-Time Clock Aware</span>
              </label>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setDeparturePreset('in15')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                    departurePreset === 'in15'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Depart in 15m
                </button>
                <button
                  type="button"
                  onClick={() => setDeparturePreset('in45')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                    departurePreset === 'in45'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Depart in 45m
                </button>
                <button
                  type="button"
                  onClick={() => setDeparturePreset('custom')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                    departurePreset === 'custom'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Custom Time
                </button>
              </div>

              {departurePreset === 'custom' && (
                <div className="relative mt-1.5">
                  <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    placeholder="e.g. 05:45 PM"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* 4. Available Capacity */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Available Seating Space (Passengers)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 5. SYSTEM-DECLARED TICKET AMOUNT (LOCKED & OFFICIAL) */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 border-2 border-indigo-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-indigo-900 tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Official Karnataka Tariff Declared by System</span>
                </span>
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Locked by System
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black text-indigo-950">₹{systemDeclaredFare}</span>
                  <span className="text-xs text-slate-600 font-semibold ml-1">/ passenger</span>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <span>Distance: <strong className="text-slate-900">{calculatedDistanceKm} km</strong></span>
                </div>
              </div>

              <div className="text-[10px] text-indigo-800/80 bg-white/70 p-2 rounded-lg border border-indigo-100 leading-relaxed">
                ⚖️ <strong>Fair Pricing Guarantee:</strong> Ticket fare is calculated using Karnataka State Stage Carriage Tariff (~₹1.40/km) based on road distance. Operators cannot overcharge; passengers are guaranteed this rate.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Broadcasting Task to Fleet...</span>
                </>
              ) : (
                <>
                  <Bus className="w-4 h-4" />
                  <span>Create Task & Broadcast to Passenger Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Location Telemetry & Map + Bookings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Trip Selector Tabs if multiple trips */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Your Broadcasted Trips:
              </span>
              <div className="flex items-center space-x-1.5">
                {trips.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTrip(t);
                      if (t.liveLocation) {
                        setCurrentSpeedKm(t.liveLocation.speedKm || 0);
                        setCurrentCheckpoint(t.liveLocation.currentStop || `${t.source} Terminal`);
                        setTripStatus(t.status || 'Ready to Depart');
                        setDirectionHeading(t.liveLocation.direction || `Heading towards ${t.destination}`);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTrip?.id === t.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {t.source} ➔ {t.destination} ({t.id})
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={loadOperatorTrips}
              title="Refresh Trips"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* ACTIVE TRIP TELEMETRY CONTROL PANEL */}
          {activeTrip ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-extrabold text-slate-900">{activeTrip.busName}</span>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {activeTrip.vehicleRegNo}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {activeTrip.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{activeTrip.source}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-blue-700">{activeTrip.destination}</span>
                    <span>• Departs: <strong>{activeTrip.departureTime}</strong></span>
                    <span>• Fare: <strong className="text-emerald-700 font-bold">₹{activeTrip.fare}</strong></span>
                  </p>
                </div>

                {/* Live GPS Broadcast Indicator */}
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="font-bold text-emerald-800">Broadcasting GPS Live</span>
                </div>
              </div>

              {/* REAL-TIME LEAFLET MAP */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span>Live GPS Vehicle Track & Highway Route</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Marker updates in real-time as you broadcast
                  </span>
                </div>

                <div 
                  ref={mapContainerRef} 
                  className="w-full h-56 rounded-2xl border border-slate-300 shadow-inner z-10"
                />
              </div>

              {/* LIVE TELEMETRY CONTROLS & SHARING */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
                    <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span>Share / Update Your Live Location</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAcquireDeviceGps}
                    disabled={isAcquiringGps}
                    className="py-1 px-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold rounded-lg flex items-center space-x-1 transition-all"
                  >
                    {isAcquiringGps ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Acquiring Fix...</span>
                      </>
                    ) : (
                      <>
                        <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                        <span>Use My Phone GPS Fix</span>
                      </>
                    )}
                  </button>
                </div>

                {telemetrySuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 font-semibold text-xs flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{telemetrySuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Current Checkpoint */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Current Landmark / Checkpoint
                    </label>
                    <select
                      value={currentCheckpoint}
                      onChange={(e) => setCurrentCheckpoint(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={`${activeTrip.source} Terminal (Bay #1)`}>{activeTrip.source} Terminal (Origin)</option>
                      <option value="Departed Terminal • Highway Corridor">Departed Terminal • On Highway</option>
                      <option value="Approaching Intermediate Checkpoint">Approaching Intermediate Checkpoint</option>
                      <option value={`Approaching ${activeTrip.destination} Bypass`}>Approaching {activeTrip.destination} Bypass</option>
                      <option value={`Arrived at ${activeTrip.destination} Terminal`}>Arrived at {activeTrip.destination} (Destination)</option>
                    </select>
                  </div>

                  {/* Trip Status */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Trip Status
                    </label>
                    <select
                      value={tripStatus}
                      onChange={(e) => setTripStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Ready to Depart">Ready to Depart</option>
                      <option value="Boarding">Boarding Passengers</option>
                      <option value="In Transit">In Transit (On Road)</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Speed & Heading */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Speed (km/h)</span>
                      <span className="font-bold text-blue-700">{currentSpeedKm} km/h</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="85"
                      value={currentSpeedKm}
                      onChange={(e) => setCurrentSpeedKm(parseInt(e.target.value, 10))}
                      className="w-full cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-600 flex items-center space-x-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>Heading: <strong>{directionHeading}</strong></span>
                  </div>

                  <button
                    type="button"
                    onClick={() => broadcastTelemetryUpdate()}
                    disabled={isUpdatingTelemetry}
                    className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    {isUpdatingTelemetry ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Broadcasting...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5" />
                        <span>Broadcast Telemetry Update</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PASSENGER BOOKINGS & REVENUE LIST */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                      <Ticket className="w-4 h-4 text-blue-600" />
                      <span>Passenger Bookings for This Vehicle</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Passengers who booked seats on your bus via Passenger Dashboard
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Seats Booked</span>
                    <span className="font-extrabold text-sm text-blue-800">
                      {activeTrip.totalSeats - activeTrip.availableSeats} / {activeTrip.totalSeats} Seats
                    </span>
                  </div>
                </div>

                {isLoadingBookings ? (
                  <div className="p-4 text-center text-slate-400 text-xs">Loading passenger bookings...</div>
                ) : tripBookings.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500 space-y-1">
                    <p className="font-semibold text-xs">No passenger bookings received yet for this trip.</p>
                    <p className="text-[11px] text-slate-400">
                      Your bus is active on the Passenger Dashboard. Seats will appear here as passengers book.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {tripBookings.map((b) => (
                      <div
                        key={b.id || b.bookingId}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{b.passengerName}</span>
                            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                              {b.bookingId}
                            </span>
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                              {b.seatCount} Seat{b.seatCount > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-2">
                            <Phone className="w-3 h-3" />
                            <span>+91 {b.passengerPhone}</span>
                            <span>•</span>
                            <span>{b.source} ➔ {b.destination}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-700 block">₹{b.totalFare}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            b.paymentMethod === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {b.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 space-y-3">
              <Bus className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">No Active Trips Created</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Use the form on the left to schedule your departure, and broadcast your vehicle to the Passenger Dashboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
