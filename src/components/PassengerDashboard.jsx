import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Bus, 
  Clock, 
  Users, 
  Navigation, 
  ShieldCheck, 
  Ticket, 
  ArrowRight, 
  CheckCircle2, 
  LocateFixed, 
  Loader2, 
  X, 
  Radio,
  RefreshCw,
  Printer,
  AlertTriangle,
  Trash2,
  Ban
} from 'lucide-react';
import { KARNATAKA_LOCATIONS, generateBusesForRoute, formatTime, generateStopsForTime, calculateDistance } from '../data/karnatakaRoutes';
import { fetchTravelTrips, fetchPassengerBookings, apiCancelBooking } from '../services/api';
import RouteMapModal from './RouteMapModal';
import BookingModal from './BookingModal';
import { useLanguage } from '../context/LanguageContext';

export default function PassengerDashboard({ currentLocation, currentUser }) {
  const { language, t } = useLanguage();
  // Clean up location string (e.g. "Kukke Subrahmanya, Dakshina Kannada" -> "Kukke Subrahmanya")
  const defaultOrigin = useMemo(() => {
    if (!currentLocation) return 'Kukke Subrahmanya';
    return currentLocation.split(',')[0].replace('(GPS Live)', '').trim();
  }, [currentLocation]);

  const [fromLoc, setFromLoc] = useState(defaultOrigin);
  const [toLoc, setToLoc] = useState('Dharmasthala');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingGps, setIsDetectingGps] = useState(false);

  // Live real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Available buses generated dynamically based on CURRENT REAL-WORLD TIME
  const [buses, setBuses] = useState([]);
  const [operatorTripsCache, setOperatorTripsCache] = useState([]);

  // Modals state
  const [selectedBusForMap, setSelectedBusForMap] = useState(null);
  const [selectedBookedTicketForMap, setSelectedBookedTicketForMap] = useState(null);
  const [selectedBusForBooking, setSelectedBusForBooking] = useState(null);
  const [viewingTicketSlip, setViewingTicketSlip] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState('');

  // Booked tickets state
  const [myBookings, setMyBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Tick the live clock every 10 seconds to keep times updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Load booked tickets from backend SQLite & localStorage
  const loadBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const userPhone = currentUser?.phone || currentUser?.name || '';
      const serverBookings = await fetchPassengerBookings(userPhone);
      const localBookings = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');

      // Deduplicate bookings
      const map = new Map();
      [...(serverBookings || []), ...localBookings].forEach(b => {
        const key = b.bookingId || b.id;
        if (key && !map.has(key)) {
          map.set(key, b);
        }
      });
      setMyBookings(Array.from(map.values()));
    } catch (err) {
      console.warn('Failed to load passenger bookings:', err);
      const localBookings = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
      setMyBookings(localBookings);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Initial load of bookings + polling every 12 seconds
  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 12000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // When fromLoc, toLoc, or currentTime updates, regenerate buses tailored to current time
  useEffect(() => {
    let isMounted = true;

    async function loadBusesWithOperatorTrips() {
      if (!fromLoc || !toLoc) return;

      const generated = generateBusesForRoute(fromLoc, toLoc, currentTime);

      try {
        const operatorTrips = await fetchTravelTrips();
        if (!isMounted) return;

        setOperatorTripsCache(operatorTrips || []);

        const qFrom = fromLoc.toLowerCase().trim();
        const qTo = toLoc.toLowerCase().trim();

        const operatorBuses = (operatorTrips || [])
          .filter(t => {
            const tSrc = (t.source || '').toLowerCase();
            const tDest = (t.destination || '').toLowerCase();
            const tVia = (t.viaRoute || '').toLowerCase();
            return (
              tSrc.includes(qFrom) || qFrom.includes(tSrc) ||
              tDest.includes(qTo) || qTo.includes(tDest) ||
              tVia.includes(qFrom) || tVia.includes(qTo) ||
              tSrc === 'kukke subrahmanya' // Always show demo operator bus on nearby corridor
            );
          })
          .map(trip => {
            const tSrc = KARNATAKA_LOCATIONS.find(l => l.name.toLowerCase() === trip.source.toLowerCase()) || KARNATAKA_LOCATIONS[0];
            const tDest = KARNATAKA_LOCATIONS.find(l => l.name.toLowerCase() === trip.destination.toLowerCase()) || KARNATAKA_LOCATIONS[1];
            const distance = trip.distanceKm || 50;
            const durationMin = Math.max(25, Math.round((distance / 45) * 60));
            const depDate = new Date();
            const stopsInfo = generateStopsForTime(tSrc, tDest, distance, depDate);

            return {
              id: trip.id,
              busName: trip.busName,
              operatorName: `${trip.operatorName} (Verified Local Travel Operator)`,
              busType: trip.busType,
              vehicleRegNo: trip.vehicleRegNo,
              source: trip.source,
              destination: trip.destination,
              departureTime: trip.departureTime,
              departureDateObj: depDate,
              minsUntilDeparture: 14,
              arrivalTime: stopsInfo.arrivalTime,
              duration: `${Math.floor(durationMin / 60) > 0 ? `${Math.floor(durationMin / 60)}h ` : ''}${durationMin % 60}m`,
              totalSeats: trip.totalSeats,
              availableSeats: trip.availableSeats,
              fare: trip.systemDeclaredFare || trip.fare,
              isOperatorTrip: true,
              isSystemFare: true,
              liveStatus: {
                currentStop: trip.liveLocation?.currentStop || `${trip.source} Terminal (Bay #1)`,
                lat: trip.liveLocation?.lat || tSrc.lat,
                lng: trip.liveLocation?.lng || tSrc.lng,
                speedKm: trip.liveLocation?.speedKm !== undefined ? trip.liveLocation.speedKm : 0,
                etaMins: 14,
                condition: `🟢 ${trip.status || 'Ready to Depart'} • Live GPS Active`,
                lastUpdated: trip.liveLocation?.lastUpdated || 'Live GPS'
              },
              optimalRoute: {
                totalDistanceKm: distance,
                estimatedTime: `${durationMin} mins`,
                highway: trip.viaRoute || 'State Rural Highway Link',
                roadCondition: 'Smooth All-Weather Link • Real-time GPS Tracked',
                stops: stopsInfo.stops
              }
            };
          });

        setBuses([...operatorBuses, ...generated]);
      } catch (e) {
        console.warn('Error loading operator trips for passenger:', e);
        if (isMounted) setBuses(generated);
      }
    }

    loadBusesWithOperatorTrips();

    return () => {
      isMounted = false;
    };
  }, [fromLoc, toLoc, currentTime]);

  // Keep fromLoc synced if currentLocation prop updates
  useEffect(() => {
    if (currentLocation) {
      const cleanLoc = currentLocation.split(',')[0].replace('(GPS Live)', '').trim();
      setFromLoc(cleanLoc);
    }
  }, [currentLocation]);

  // Filter buses by search query
  const displayedBuses = useMemo(() => {
    if (!searchQuery.trim()) return buses;
    const q = searchQuery.toLowerCase();
    return buses.filter(b => 
      b.busName.toLowerCase().includes(q) ||
      b.busType.toLowerCase().includes(q) ||
      b.destination.toLowerCase().includes(q) ||
      b.source.toLowerCase().includes(q) ||
      b.optimalRoute.stops.some(s => s.name.toLowerCase().includes(q))
    );
  }, [buses, searchQuery]);

  // Handle live GPS detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const { latitude, longitude } = pos.coords;
        let closest = KARNATAKA_LOCATIONS[0];
        let minDist = Number.MAX_VALUE;
        KARNATAKA_LOCATIONS.forEach(loc => {
          const d = Math.sqrt(Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2));
          if (d < minDist) {
            minDist = d;
            closest = loc;
          }
        });
        setFromLoc(closest.name);
      },
      () => {
        setIsDetectingGps(false);
        setFromLoc('Kukke Subrahmanya');
      },
      { timeout: 6000 }
    );
  };

  const handleBookingConfirmed = (newBooking) => {
    setMyBookings(prev => [newBooking, ...prev.filter(b => b.bookingId !== newBooking.bookingId)]);
    setBuses(prev => prev.map(b => b.id === newBooking.busId ? { ...b, availableSeats: Math.max(0, b.availableSeats - newBooking.seatCount) } : b));
    loadBookings();
  };

  // Cancel Booking Handler
  const handleExecuteCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancellingBooking(true);
    try {
      await apiCancelBooking(bookingToCancel.bookingId || bookingToCancel.id);
      setCancelSuccessMessage(`Ticket #${bookingToCancel.bookingId} cancelled successfully! ₹${bookingToCancel.totalFare} refund has been processed and seat restored.`);
      setMyBookings(prev => prev.map(b => (b.bookingId === bookingToCancel.bookingId || b.id === bookingToCancel.id) ? { ...b, paymentStatus: 'CANCELLED (Refund Processed)' } : b));
      setBookingToCancel(null);
      loadBookings();
      setTimeout(() => setCancelSuccessMessage(''), 5000);
    } catch (err) {
      alert('Error cancelling booking: ' + err.message);
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const handleRemoveCancelledBooking = (bookingId) => {
    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    const filtered = saved.filter(b => b.bookingId !== bookingId && b.id !== bookingId);
    localStorage.setItem('rural_link_passenger_bookings', JSON.stringify(filtered));
    setMyBookings(prev => prev.filter(b => b.bookingId !== bookingId && b.id !== bookingId));
  };

  // Track booked bus on map with live coordinates, checkpoints, and route
  const handleTrackBookedBus = (booking) => {
    // 1. Try finding in loaded buses
    let targetBus = buses.find(b => 
      b.id === booking.busId || 
      (b.vehicleRegNo && booking.vehicleRegNo && b.vehicleRegNo.toLowerCase().replace(/[-\s]/g, '') === booking.vehicleRegNo.toLowerCase().replace(/[-\s]/g, '')) ||
      (b.busName === booking.busName && b.source === booking.source && b.destination === booking.destination)
    );

    // 2. Try finding in operator trips cache
    const opTrip = operatorTripsCache.find(t => 
      t.id === booking.busId || 
      (t.vehicleRegNo && booking.vehicleRegNo && t.vehicleRegNo.toLowerCase().replace(/[-\s]/g, '') === booking.vehicleRegNo.toLowerCase().replace(/[-\s]/g, '')) ||
      (t.busName === booking.busName && t.source === booking.source)
    );

    const src = KARNATAKA_LOCATIONS.find(l => l.name.toLowerCase() === (booking.source || '').toLowerCase()) || KARNATAKA_LOCATIONS[0];
    const dest = KARNATAKA_LOCATIONS.find(l => l.name.toLowerCase() === (booking.destination || '').toLowerCase()) || KARNATAKA_LOCATIONS[1];
    const dist = opTrip?.distanceKm || calculateDistance(src.lat, src.lng, dest.lat, dest.lng);
    const durationMin = Math.max(25, Math.round((dist / 45) * 60));
    const depDate = new Date();
    const stopsInfo = generateStopsForTime(src, dest, dist, depDate);

    // Coordinates: If operator trip has liveLocation, prioritize it!
    let liveLat = opTrip?.liveLocation?.lat || targetBus?.liveStatus?.lat;
    let liveLng = opTrip?.liveLocation?.lng || targetBus?.liveStatus?.lng;
    let liveStop = opTrip?.liveLocation?.currentStop || targetBus?.liveStatus?.currentStop;
    let liveSpeed = opTrip?.liveLocation?.speedKm !== undefined ? opTrip.liveLocation.speedKm : (targetBus?.liveStatus?.speedKm || 38);
    let condition = opTrip?.status ? `🟢 ${opTrip.status} • Live GPS Broadcaster` : '🟢 En Route • Live GPS Synced';

    if (!liveLat || !liveLng) {
      // Interpolate along the route
      liveLat = src.lat + (dest.lat - src.lat) * 0.42;
      liveLng = src.lng + (dest.lng - src.lng) * 0.42;
      liveStop = stopsInfo.stops[1]?.name || `${booking.source} Link Corridor`;
    }

    const trackingBusObject = {
      id: booking.busId || 'BUS-' + booking.bookingId,
      busName: booking.busName || 'Rural Express',
      operatorName: opTrip?.operatorName || 'Verified Karnataka Transit Operator',
      busType: opTrip?.busType || 'Express Stage Carriage',
      vehicleRegNo: booking.vehicleRegNo || 'KA-19-F-1234',
      source: booking.source,
      destination: booking.destination,
      departureTime: booking.departureTime,
      arrivalTime: stopsInfo.arrivalTime,
      duration: `${Math.floor(durationMin / 60) > 0 ? `${Math.floor(durationMin / 60)}h ` : ''}${durationMin % 60}m`,
      totalSeats: opTrip?.totalSeats || 30,
      availableSeats: opTrip?.availableSeats !== undefined ? opTrip.availableSeats : 6,
      fare: Math.round(booking.totalFare / (booking.seatCount || 1)),
      isOperatorTrip: !!opTrip,
      liveStatus: {
        currentStop: liveStop || `${booking.source} Transit Corridor`,
        lat: liveLat,
        lng: liveLng,
        speedKm: liveSpeed,
        etaMins: Math.max(10, Math.round(durationMin * 0.4)),
        condition: condition,
        lastUpdated: opTrip?.liveLocation?.lastUpdated || 'Live GPS'
      },
      optimalRoute: {
        totalDistanceKm: dist,
        estimatedTime: `${durationMin} mins`,
        highway: opTrip?.viaRoute || 'State Rural Highway Link • GPS Tracked',
        roadCondition: 'Smooth All-Weather Link • Real-time GPS Tracked',
        stops: stopsInfo.stops
      }
    };

    setSelectedBookedTicketForMap(booking);
    setSelectedBusForMap(trackingBusObject);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Real-Time Clock */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-950/80 border border-blue-500/40 px-3 py-1 rounded-full text-xs font-semibold text-sky-300 mb-3">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>{t('passengerPortalTitle', 'Live Karnataka Rural Transit System')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {t('availableBuses', 'Real-Time Available Buses & Tracking')}
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm mt-1.5">
              {t('passengerPortalSubtitle', 'Showing immediate next departures based on your current local time across all Karnataka routes with live satellite bus tracking.')}
            </p>
          </div>

          {/* Live Real-World Time Display */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center space-x-3 self-start sm:self-auto shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider block">
                {t('liveLoc', 'Current Local Time')}
              </span>
              <span className="text-lg font-black font-mono tracking-wide text-white">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Universal Search Bar */}
        <div className="mt-6 bg-white rounded-2xl p-3 sm:p-4 text-slate-800 shadow-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Origin (From) */}
            <div className="md:col-span-5 relative">
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('pickup', 'Origin (Pickup Point)')}
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  {isDetectingGps ? (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  ) : (
                    <LocateFixed className="w-3 h-3 text-blue-600" />
                  )}
                  <span>{t('detectGps', 'Detect GPS')}</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <select
                  value={fromLoc}
                  onChange={(e) => setFromLoc(e.target.value)}
                  className="w-full text-sm font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                >
                  {KARNATAKA_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden md:flex md:col-span-1 justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Destination (To) */}
            <div className="md:col-span-5 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                {t('drop', 'Destination (Where to go?)')}
              </label>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <select
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                  className="w-full text-sm font-semibold bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                >
                  {KARNATAKA_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} ({loc.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Swap Button */}
            <div className="md:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const temp = fromLoc;
                  setFromLoc(toLoc);
                  setToLoc(temp);
                }}
                title="Swap Origin and Destination"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                ⇄
              </button>
            </div>
          </div>

          {/* Keyword Search Filter (Search by Bus Name / Specific Destination) */}
          <div className="pt-2 border-t border-slate-100 relative">
            <Search className="w-4 h-4 absolute left-3 top-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination, bus type, or operator name across Karnataka (e.g. Dharmasthala, Mangalore, Grama Sarige...)"
              className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎫 BOOKED DETAILS & LIVE BUS TRACKING SECTION (Always Prominently Visible) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-200 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Your Booked Tickets & Live Bus Tracking
                </h2>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {myBookings.length} {myBookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Real-time satellite GPS tracking & live checkpoint updates for your booked journeys</span>
              </p>
            </div>
          </div>

          {myBookings.length > 0 && (
            <button
              type="button"
              onClick={loadBookings}
              className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Refresh live telemetry and bookings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBookings ? 'animate-spin text-blue-600' : ''}`} />
              <span>Sync GPS Telemetry</span>
            </button>
          )}
        </div>

        {/* Cancellation Feedback Banner */}
        {cancelSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{cancelSuccessMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => setCancelSuccessMessage('')} 
              className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {myBookings.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <Bus className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-sm text-slate-700">No Active Bus Bookings Yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select your origin and destination below, choose an upcoming departure, and book your seat to unlock real-time GPS tracking and live corridor updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myBookings.map((booking, idx) => {
              // Find matching operator live trip telemetry if any
              const matchedOp = operatorTripsCache.find(t => 
                t.id === booking.busId || 
                (t.vehicleRegNo && booking.vehicleRegNo && t.vehicleRegNo.toLowerCase().replace(/[-\s]/g, '') === booking.vehicleRegNo.toLowerCase().replace(/[-\s]/g, ''))
              );
              const liveLoc = matchedOp?.liveLocation;
              const currentStopName = liveLoc?.currentStop || `${booking.source} Transit Corridor`;
              const liveSpeed = liveLoc?.speedKm !== undefined ? `${liveLoc.speedKm} km/h` : '38 km/h';
              const isPaid = booking.paymentStatus?.toLowerCase().includes('paid');
              const isCancelled = booking.paymentStatus?.toLowerCase().includes('cancel');

              return (
                <div
                  key={booking.bookingId || idx}
                  className={`rounded-2xl p-4 sm:p-5 border-2 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                    isCancelled
                      ? 'bg-slate-50/80 border-slate-200 opacity-90'
                      : 'bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border-blue-200/80 hover:border-blue-400 hover:shadow-md'
                  }`}
                >
                  {/* Top Bar: Reference ID & Payment Status */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-100/70 border border-blue-300/60 px-2.5 py-0.5 rounded-lg">
                        Ref #{booking.bookingId}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {booking.bookedAt ? new Date(booking.bookedAt).toLocaleDateString() : 'Today'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isCancelled ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 bg-rose-100 text-rose-800 border border-rose-300">
                          <Ban className="w-3 h-3 mr-0.5" />
                          <span>CANCELLED (Refund Processed)</span>
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          <span>{booking.paymentStatus || 'PAID (UPI Confirmed)'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route & Bus Details */}
                  <div className="space-y-2">
                    {/* Route banner */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCancelled ? 'bg-slate-400' : 'bg-emerald-600'}`}></div>
                        <span className={`font-black text-sm truncate ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>{booking.source}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400 flex-shrink-0 px-1">
                        <span className="text-xs font-mono">➔</span>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-1 min-w-0 justify-end">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCancelled ? 'bg-slate-400' : 'bg-rose-600'}`}></div>
                        <span className={`font-black text-sm truncate ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>{booking.destination}</span>
                      </div>
                    </div>

                    {/* Bus Details & Timetable */}
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <div>
                        <span className="font-extrabold text-slate-800">{booking.busName}</span>
                        <span className="text-[11px] font-mono text-slate-500 ml-1.5 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {booking.vehicleRegNo}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 font-bold text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>{booking.departureTime}</span>
                      </div>
                    </div>

                    {/* Passenger & Fare Summary */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                      <div>
                        <span>Passenger: </span>
                        <span className="font-semibold text-slate-800">{booking.passengerName || 'Passenger'}</span>
                        <span className="text-[11px] text-slate-400 ml-1">({booking.passengerPhone || currentUser?.phone})</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        ₹{booking.totalFare} <span className="text-[10px] text-slate-500 font-normal">({booking.seatCount} Seat{booking.seatCount > 1 ? 's' : ''})</span>
                      </div>
                    </div>
                  </div>

                  {/* Live GPS Telemetry Indicator Box */}
                  {isCancelled ? (
                    <div className="bg-rose-950/90 border border-rose-500/40 text-white rounded-xl p-3 space-y-1 text-xs shadow-inner">
                      <div className="flex items-center space-x-1.5 text-rose-300 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Booking Cancelled • Seat Released Back to Operator</span>
                      </div>
                      <div className="text-[11px] text-rose-200">
                        100% refund of ₹{booking.totalFare} has been initiated to your {booking.paymentMethod === 'online' ? 'UPI Account' : 'original payment method'}.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900 text-white rounded-xl p-3 space-y-1.5 text-xs shadow-inner">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>🟢 En Route • Live GPS Broadcast</span>
                        </div>
                        <span className="font-mono text-[11px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded border border-slate-700">
                          ⚡ Speed: {liveSpeed}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <div className="truncate max-w-[210px] sm:max-w-xs flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          <span className="truncate">Near: {currentStopName}</span>
                        </div>
                        <span className="text-amber-300 font-semibold flex-shrink-0">
                          ETA ~14 mins
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons: Track This Bus (Live GPS), Ticket Slip, & Cancel Booking */}
                  <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
                    {!isCancelled ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTrackBookedBus(booking)}
                          className="flex-1 min-w-[170px] py-2.5 px-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                        >
                          <Navigation className="w-4 h-4 text-sky-200 group-hover:rotate-45 transition-transform" />
                          <span>Track This Bus (Live GPS)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewingTicketSlip(booking)}
                          className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                          title="View digital ticket pass slip"
                        >
                          <Ticket className="w-4 h-4 text-blue-600" />
                          <span className="hidden sm:inline">Pass Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBookingToCancel(booking)}
                          className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                          title="Cancel ticket booking with instant refund"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span>Cancel Booking</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewingTicketSlip(booking)}
                          className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Ticket className="w-4 h-4 text-slate-500" />
                          <span>View Cancelled Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveCancelledBooking(booking.bookingId || booking.id)}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                          title="Dismiss from dashboard"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Corridor Summary & Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Bus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Departures from <span className="text-blue-700">{fromLoc}</span> to <span className="text-blue-700">{toLoc}</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Timetable synchronized with current time ({formatTime(currentTime)})</span>
          </p>
        </div>
      </div>

      {/* Available Buses List with Real-Time Departure Countdowns */}
      <div className="space-y-4">
        {displayedBuses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 space-y-2">
            <Bus className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm">No buses match your search keyword "{searchQuery}".</p>
            <p className="text-xs text-slate-400">Try clearing the search box to view upcoming departures on this corridor.</p>
          </div>
        ) : (
          displayedBuses.map((bus) => {
            const isLowSeats = bus.availableSeats <= 6;
            const isDepartingSoon = bus.minsUntilDeparture <= 25;

            return (
              <div
                key={bus.id}
                className={`rounded-3xl p-5 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  bus.isOperatorTrip
                    ? 'bg-gradient-to-r from-emerald-50/40 via-white to-blue-50/30 border-2 border-emerald-500 shadow-md'
                    : 'bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                {/* Left Details: Operator, Times & Route */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-extrabold text-base text-slate-900">{bus.busName}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded border border-slate-200">
                      {bus.vehicleRegNo}
                    </span>
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                      {bus.busType}
                    </span>

                    {/* Operator Live GPS Badge */}
                    {bus.isOperatorTrip && (
                      <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                        <Radio className="w-3 h-3 text-emerald-200 animate-pulse" />
                        <span>Verified Local Operator • Live GPS</span>
                      </span>
                    )}

                    {/* Real-time departure countdown badge */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                        isDepartingSoon
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      <span>
                        {bus.minsUntilDeparture <= 20
                          ? `Departs in ${bus.minsUntilDeparture} mins`
                          : `Departs in ${Math.floor(bus.minsUntilDeparture / 60) > 0 ? `${Math.floor(bus.minsUntilDeparture / 60)}h ` : ''}${bus.minsUntilDeparture % 60}m`}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Upcoming Departure</span>
                      <span className="font-extrabold text-slate-900 text-sm">{bus.departureTime}</span>
                      <span className="text-[11px] text-slate-500 block">{bus.source}</span>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-[10px] text-slate-400">{bus.duration}</span>
                      <div className="w-24 h-0.5 bg-slate-300 relative my-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute left-0 -top-0.5"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-600 absolute right-0 -top-0.5"></div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{bus.optimalRoute.totalDistanceKm} km</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Estimated Arrival</span>
                      <span className="font-bold text-slate-800 text-sm">{bus.arrivalTime}</span>
                      <span className="text-[11px] text-slate-500 block">{bus.destination}</span>
                    </div>
                  </div>

                  {/* Live GPS Telemetry Badge */}
                  <div className="pt-2 flex items-center space-x-2 text-xs flex-wrap gap-y-1">
                    <div className="inline-flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-amber-900 text-[11px]">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                      <span className="font-bold">Live Status:</span>
                      <span>{bus.liveStatus.currentStop} ({bus.liveStatus.condition})</span>
                    </div>

                    <div className="inline-flex items-center text-[11px] text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                      <span>{bus.optimalRoute.highway}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Seats, Fare & Action Buttons */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-3 min-w-[210px]">
                  <div className="text-left md:text-right">
                    <div className="flex items-center md:justify-end space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isLowSeats
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {bus.availableSeats} Seats Available
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-slate-400">Fare: </span>
                      <span className="text-xl font-black text-slate-900">₹{bus.fare}</span>
                      <span className="text-[10px] text-slate-500"> / seat</span>
                      {bus.isOperatorTrip && (
                        <span className="block text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mt-0.5">
                          🏛️ System Declared Tariff
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 w-full sm:w-auto">
                    {/* Optimal Route Map Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookedTicketForMap(null);
                        setSelectedBusForMap(bus);
                      }}
                      className="flex-1 sm:flex-initial px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      title="View route map and stops"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Map</span>
                    </button>

                    {/* Book Seat Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedBusForBooking(bus)}
                      disabled={bus.availableSeats === 0}
                      className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{bus.availableSeats === 0 ? 'Full' : 'Book Seat'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optimal Route & Leaflet Map Modal with direct booking action or booked tracking */}
      {selectedBusForMap && (
        <RouteMapModal
          isOpen={!!selectedBusForMap}
          onClose={() => {
            setSelectedBusForMap(null);
            setSelectedBookedTicketForMap(null);
          }}
          bus={selectedBusForMap}
          bookedTicket={selectedBookedTicketForMap}
          onBookFromMap={(busToBook) => setSelectedBusForBooking(busToBook)}
        />
      )}

      {/* Booking Flow Modal (Online UPI & Cash on Boarding) */}
      {selectedBusForBooking && (
        <BookingModal
          isOpen={!!selectedBusForBooking}
          onClose={() => setSelectedBusForBooking(null)}
          bus={selectedBusForBooking}
          currentUser={currentUser}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {/* Digital Ticket Pass Slip Modal */}
      {viewingTicketSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Digital Transit Boarding Pass</h3>
                  <p className="text-xs text-sky-200 font-mono">Reference #{viewingTicketSlip.bookingId}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingTicketSlip(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pass Body */}
            <div className="p-6 space-y-5 text-slate-800 text-xs">
              {/* Route Banner */}
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Origin</span>
                  <span className="font-extrabold text-base text-slate-900">{viewingTicketSlip.source}</span>
                </div>
                <div className="px-3 text-blue-500 font-bold text-sm">➔</div>
                <div className="text-right">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Destination</span>
                  <span className="font-extrabold text-base text-slate-900">{viewingTicketSlip.destination}</span>
                </div>
              </div>

              {/* Transit Details Grid */}
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Bus Service</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewingTicketSlip.busName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Reg No</span>
                  <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{viewingTicketSlip.vehicleRegNo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Departure Time</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewingTicketSlip.departureTime}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Reserved Seats</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewingTicketSlip.seatCount} Seat{viewingTicketSlip.seatCount > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Passenger</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{viewingTicketSlip.passengerName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Fare Paid</span>
                  <p className="font-extrabold text-emerald-700 text-sm mt-0.5">₹{viewingTicketSlip.totalFare}</p>
                </div>
              </div>

              {/* Verification & QR Code Simulation */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Official E-Ticket Verified</span>
                  </div>
                  <p className="text-[10px] text-emerald-700">{viewingTicketSlip.paymentStatus}</p>
                </div>
                {/* QR Code Graphic */}
                <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-300 flex items-center justify-center shadow-sm">
                  <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5">
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-xs"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Pass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const slip = viewingTicketSlip;
                  setViewingTicketSlip(null);
                  handleTrackBookedBus(slip);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Track Bus on Map</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Cancel Ticket Booking?</h3>
                  <p className="text-xs text-rose-200 font-mono">Ref #{bookingToCancel.bookingId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancellingBooking}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="font-bold text-sm text-slate-900">
                  {bookingToCancel.source} ➔ {bookingToCancel.destination}
                </div>
                <div className="text-[11px] text-slate-600">
                  Bus: <span className="font-semibold text-slate-800">{bookingToCancel.busName}</span> ({bookingToCancel.vehicleRegNo})
                </div>
                <div className="text-[11px] text-slate-600">
                  Seats: <span className="font-semibold text-slate-800">{bookingToCancel.seatCount} Seat(s)</span> • Total Fare: <span className="font-bold text-rose-700">₹{bookingToCancel.totalFare}</span>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>100% Instant Refund:</strong> Your payment of ₹{bookingToCancel.totalFare} will be credited back via {bookingToCancel.paymentMethod === 'online' ? 'UPI Account' : 'original payment method'}.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Seat Inventory Released:</strong> The reserved seat(s) will be automatically returned to the rural travel operator.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Zero Cancellation Fee:</strong> No penalty or deduction on Rural Link.</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancellingBooking}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelBooking}
                disabled={isCancellingBooking}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {isCancellingBooking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Cancel Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
