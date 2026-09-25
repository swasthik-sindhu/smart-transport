import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { X, Navigation, MapPin, Bus, Clock, ShieldCheck, CheckCircle2, Ticket } from 'lucide-react';

export default function RouteMapModal({ isOpen, onClose, bus, onBookFromMap }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !bus || !mapContainerRef.current) return;

    // Clean up existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { stops } = bus.optimalRoute;
    const waypoints = stops.map(s => [s.lat, s.lng]);

    // Initial center on the first stop
    const initialCenter = waypoints.length > 0 ? waypoints[0] : [12.6631, 75.6158];
    const map = L.map(mapContainerRef.current).setView(initialCenter, 10);
    mapInstanceRef.current = map;

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Draw Route Polyline
    const polyline = L.polyline(waypoints, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineJoin: 'round'
    }).addTo(map);

    // Fit map bounds to polyline
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Custom Stop Marker Icons
    stops.forEach((stop, index) => {
      const isStart = index === 0;
      const isEnd = index === stops.length - 1;
      const isDharmasthala = stop.name.toLowerCase().includes('dharmasthala');

      const bgColor = isStart ? '#16a34a' : isEnd ? '#dc2626' : isDharmasthala ? '#8b5cf6' : '#2563eb';
      const label = isStart ? 'S' : isEnd ? 'D' : isDharmasthala ? 'DH' : `${index + 1}`;

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `<div style="background-color: ${bgColor}; color: white; width: ${isDharmasthala ? '32px' : '26px'}; height: ${isDharmasthala ? '32px' : '26px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${label}</div>`,
        iconSize: isDharmasthala ? [32, 32] : [26, 26],
        iconAnchor: isDharmasthala ? [16, 16] : [13, 13]
      });

      L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <b style="color: ${isDharmasthala ? '#8b5cf6' : '#2563eb'};">${stop.name}</b><br/>
            ${isDharmasthala ? '<span style="background: #ede9fe; color: #5b21b6; padding: 2px 4px; border-radius: 4px; font-size: 10px; font-weight: bold;">Key Intermediate Transit Hub</span><br/>' : ''}
            Scheduled Time: <b>${stop.time}</b><br/>
            Distance from Origin: <b>${stop.km} km</b>
          </div>
        `);
    });

    // Live Bus Marker
    if (bus.liveStatus) {
      const busIcon = L.divIcon({
        className: 'custom-bus-live-marker',
        html: `<div style="background-color: #f59e0b; color: #1e1b4b; padding: 5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 14px #f59e0b; animation: pulse 2s infinite;">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.6-.4-1-1-1H3c-.6 0-1 .4-1 1 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([bus.liveStatus.lat, bus.liveStatus.lng], { icon: busIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <b style="color: #2563eb;">${bus.busName} (LIVE GPS)</b><br/>
            📍 Near: ${bus.liveStatus.currentStop}<br/>
            ⚡ Speed: ${bus.liveStatus.speedKm} km/h<br/>
            ⏱️ ETA: ~${bus.liveStatus.etaMins} mins
          </div>
        `)
        .openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, bus]);

  if (!isOpen || !bus) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">{bus.busName}</h3>
                <span className="text-xs bg-blue-950 text-sky-300 font-mono px-2 py-0.5 rounded border border-blue-700">
                  {bus.vehicleRegNo}
                </span>
              </div>
              <p className="text-xs text-sky-200">
                Route: <span className="font-semibold text-white">{bus.source}</span> → <span className="font-semibold text-white">{bus.destination}</span> ({bus.optimalRoute.totalDistanceKm} km)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Route Intelligence Banner */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-blue-900 gap-2">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
            <span className="font-bold">Live GPS Checkpoint:</span>
            <span>{bus.liveStatus.currentStop} ({bus.liveStatus.speedKm} km/h)</span>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Optimal Corridor:</span>
            <span className="text-slate-600">{bus.optimalRoute.roadCondition}</span>
          </div>
        </div>

        {/* Body: Map & Timeline Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3">
          {/* Map View */}
          <div className="md:col-span-2 min-h-[340px] md:min-h-[440px] relative bg-slate-100">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
          </div>

          {/* Stops Timeline Breakdown */}
          <div className="p-4 bg-slate-50 border-l border-slate-200 overflow-y-auto max-h-[440px] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Stops & Timetable
              </span>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-2 py-0.5 rounded">
                Karnataka Route
              </span>
            </div>

            <div className="relative pl-5 border-l-2 border-blue-300 space-y-4 my-2">
              {bus.optimalRoute.stops.map((stop, idx) => {
                const isDharmasthala = stop.name.toLowerCase().includes('dharmasthala');
                return (
                  <div key={idx} className="relative">
                    {/* Pin Dot */}
                    <div
                      className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        idx === 0
                          ? 'bg-emerald-600'
                          : idx === bus.optimalRoute.stops.length - 1
                          ? 'bg-rose-600'
                          : isDharmasthala
                          ? 'bg-purple-600 ring-2 ring-purple-300'
                          : 'bg-blue-600'
                      }`}
                    />
                    <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                      <span className={isDharmasthala ? 'font-bold text-purple-900' : ''}>
                        {stop.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{stop.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{stop.km === 0 ? 'Starting Point' : `${stop.km} km from origin`}</span>
                      {isDharmasthala && (
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1 rounded">
                          Transit Hub
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 mt-4">
              <div className="font-semibold text-slate-700">Optimal Route Highlights:</div>
              <p className="text-[11px] text-slate-500">
                • Highway: {bus.optimalRoute.highway}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                • Verified all-weather road with live conductor seat sync.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with DIRECT BOOKING BUTTON */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Seat Fare:</span>
            <span className="font-extrabold text-slate-900 text-base">₹{bus.fare}</span>
            <span className="text-slate-500 text-[11px]"> ({bus.availableSeats} seats left)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onBookFromMap) onBookFromMap(bus);
              }}
              disabled={bus.availableSeats === 0}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md flex items-center space-x-1.5"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Ticket on this Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
