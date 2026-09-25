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
  Compass, 
  CheckCircle2, 
  LocateFixed, 
  Loader2, 
  X, 
  Sparkles, 
  Radio 
} from 'lucide-react';
import { KARNATAKA_LOCATIONS, generateBusesForRoute, formatTime } from '../data/karnatakaRoutes';
import RouteMapModal from './RouteMapModal';
import BookingModal from './BookingModal';

export default function PassengerDashboard({ currentLocation, currentUser }) {
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

  // Modals state
  const [selectedBusForMap, setSelectedBusForMap] = useState(null);
  const [selectedBusForBooking, setSelectedBusForBooking] = useState(null);

  // Recent bookings drawer
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  // Tick the live clock every 10 seconds to keep times updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // When fromLoc, toLoc, or currentTime updates, regenerate buses tailored to current time
  useEffect(() => {
    if (fromLoc && toLoc) {
      const generated = generateBusesForRoute(fromLoc, toLoc, currentTime);
      setBuses(generated);
    }
  }, [fromLoc, toLoc, currentTime]);

  // Keep fromLoc synced if currentLocation prop updates
  useEffect(() => {
    if (currentLocation) {
      const cleanLoc = currentLocation.split(',')[0].replace('(GPS Live)', '').trim();
      setFromLoc(cleanLoc);
    }
  }, [currentLocation]);

  // Load booked tickets
  useEffect(() => {
    const savedBookings = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    setMyBookings(savedBookings);
  }, []);

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
    setMyBookings(prev => [newBooking, ...prev]);
    setBuses(prev => prev.map(b => b.id === newBooking.busId ? { ...b, availableSeats: Math.max(0, b.availableSeats - newBooking.seatCount) } : b));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Real-Time Clock */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-blue-950/80 border border-blue-500/40 px-3 py-1 rounded-full text-xs font-semibold text-sky-300 mb-3">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Karnataka Rural Transit System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Real-Time Available Buses
            </h1>
            <p className="text-sky-100 text-xs sm:text-sm mt-1.5">
              Showing immediate next departures based on your current local time across all Karnataka routes.
            </p>
          </div>

          {/* Live Real-World Time Display */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex items-center space-x-3 self-start sm:self-auto shadow-inner">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] text-sky-300 font-semibold uppercase tracking-wider block">
                Current Local Time
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
                  Origin (Pickup Point)
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
                  <span>Detect GPS</span>
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
                Destination (Where to go?)
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

        {myBookings.length > 0 && (
          <button
            onClick={() => setShowMyBookings(!showMyBookings)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            <Ticket className="w-4 h-4 text-blue-600" />
            <span>My Booked Tickets ({myBookings.length})</span>
          </button>
        )}
      </div>

      {/* Recent Bookings Drawer if toggled */}
      {showMyBookings && myBookings.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <Ticket className="w-4 h-4 text-blue-600" />
              <span>Your Active Digital Tickets</span>
            </h3>
            <button
              onClick={() => setShowMyBookings(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Hide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myBookings.map((b, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-800">{b.source} → {b.destination}</div>
                  <div className="text-[11px] text-slate-500">{b.busName} • {b.departureTime}</div>
                  <div className="text-[11px] font-mono text-blue-700 font-semibold mt-0.5">Ref: {b.bookingId}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-900 block">₹{b.totalFare}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    {b.seatCount} Seat{b.seatCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                    </div>
                  </div>

                  <div className="flex space-x-2 w-full sm:w-auto">
                    {/* Optimal Route Map Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedBusForMap(bus)}
                      className="flex-1 sm:flex-initial px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
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
                      className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1"
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

      {/* Optimal Route & Leaflet Map Modal with direct booking action */}
      {selectedBusForMap && (
        <RouteMapModal
          isOpen={!!selectedBusForMap}
          onClose={() => setSelectedBusForMap(null)}
          bus={selectedBusForMap}
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
    </div>
  );
}
