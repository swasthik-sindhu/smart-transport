import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  X, 
  Truck, 
  MapPin, 
  Compass, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Navigation, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';
import { KARNATAKA_LOCATIONS } from '../data/karnatakaRoutes';

export default function GoodsLiveMapModal({ isOpen, onClose, shipment }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !shipment || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const { liveTelemetry, pickupLocation, targetMandi } = shipment;

    // Dynamically match origin coordinates from the farmer's pickup location
    const matchedOrigin = KARNATAKA_LOCATIONS.find(l => 
      pickupLocation?.toLowerCase().includes(l.name.toLowerCase()) || 
      l.name.toLowerCase().includes(pickupLocation?.toLowerCase())
    );
    const originCoords = matchedOrigin ? [matchedOrigin.lat, matchedOrigin.lng] : [12.6631, 75.6158];

    // Dynamically match destination coordinates from the target Mandi
    const matchedDest = KARNATAKA_LOCATIONS.find(l => 
      targetMandi?.toLowerCase().includes(l.name.toLowerCase()) ||
      targetMandi?.toLowerCase().includes(l.district.toLowerCase())
    );
    const destinationCoords = matchedDest ? [matchedDest.lat, matchedDest.lng] : [12.8698, 74.8430];

    const currentLat = liveTelemetry?.lat || ((originCoords[0] + destinationCoords[0]) / 2);
    const currentLng = liveTelemetry?.lng || ((originCoords[1] + destinationCoords[1]) / 2);
    const currentCoords = [currentLat, currentLng];

    const map = L.map(mapContainerRef.current).setView(currentCoords, 10);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Route polyline from Origin -> Current -> Destination
    const fullRoute = [originCoords, currentCoords, destinationCoords];
    const polyline = L.polyline(fullRoute, {
      color: '#16a34a',
      weight: 5,
      opacity: 0.85,
      dashArray: '6, 8',
      lineJoin: 'round'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Origin Marker (Farm)
    const farmIcon = L.divIcon({
      className: 'custom-farm-marker',
      html: `<div style="background-color: #16a34a; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🌱</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker(originCoords, { icon: farmIcon })
      .addTo(map)
      .bindPopup(`<b>Farm Pickup Point</b><br/>${pickupLocation}`);

    // Destination Marker (APMC Mandi)
    const mandiIcon = L.divIcon({
      className: 'custom-mandi-marker',
      html: `<div style="background-color: #dc2626; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏛️</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker(destinationCoords, { icon: mandiIcon })
      .addTo(map)
      .bindPopup(`<b>Destination Market</b><br/>${targetMandi}`);

    // Live Goods Vehicle Marker with Direction Arrow
    const liveTruckIcon = L.divIcon({
      className: 'custom-live-truck-marker',
      html: `<div style="background-color: #2563eb; color: white; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 16px #2563eb; animation: pulse 2s infinite;">
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
             </div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    L.marker(currentCoords, { icon: liveTruckIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 180px;">
          <b style="color: #2563eb;">📦 Your Harvest In Transit</b><br/>
          <b>Crop:</b> ${shipment.cropType} (${shipment.weightQuintals} Qtl)<br/>
          <b>Location:</b> ${liveTelemetry.currentLocationName}<br/>
          <b>Direction:</b> ${liveTelemetry.direction}<br/>
          <b>Speed:</b> ${liveTelemetry.speedKm} km/h • <b>ETA:</b> ~${liveTelemetry.etaMinutes} mins
        </div>
      `)
      .openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, shipment]);

  if (!isOpen || !shipment) return null;

  const { liveTelemetry, assignedVehicle } = shipment;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-emerald-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">Live Goods Telemetry & Direction</h3>
                <span className="text-xs bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-700">
                  {shipment.id}
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                {shipment.cropType} ({shipment.weightQuintals} Quintals) → <span className="font-semibold text-white">{shipment.targetMandi}</span>
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

        {/* Direction Indicator Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex flex-wrap items-center justify-between text-xs text-emerald-950 gap-2">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-700 animate-spin-slow" />
            <span className="font-bold">Heading & Direction:</span>
            <span className="font-semibold text-emerald-800">{liveTelemetry?.direction}</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Speed: <strong>{liveTelemetry?.speedKm} km/h</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>ETA: <strong>~{liveTelemetry?.etaMinutes} mins</strong> ({liveTelemetry?.distanceRemainingKm} km left)</span>
            </div>
          </div>
        </div>

        {/* Body: Map & Shipment Milestones Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3">
          {/* Map View */}
          <div className="md:col-span-2 min-h-[340px] md:min-h-[440px] relative bg-slate-100">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
          </div>

          {/* Shipment Milestones Timeline */}
          <div className="p-4 bg-slate-50 border-l border-slate-200 overflow-y-auto max-h-[440px] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Transit Milestones
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Active Tracking
              </span>
            </div>

            {/* Milestones list */}
            <div className="relative pl-5 border-l-2 border-emerald-400 space-y-4 my-2">
              {liveTelemetry?.milestones?.map((step, idx) => (
                <div key={idx} className="relative">
                  <div
                    className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      step.status === 'completed'
                        ? 'bg-emerald-600'
                        : step.status === 'active'
                        ? 'bg-blue-600 ring-4 ring-blue-100 animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                    <span className={step.status === 'active' ? 'text-blue-700 font-bold' : ''}>
                      {step.title}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {step.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Transport Driver Card */}
            {assignedVehicle && (
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-xs space-y-2 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assigned Freight Carrier
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{assignedVehicle.driverName}</div>
                    <div className="text-slate-500 text-[11px]">{assignedVehicle.vehicleName} • <span className="font-mono">{assignedVehicle.vehicleRegNo}</span></div>
                  </div>
                  <a
                    href={`tel:${assignedVehicle.driverPhone}`}
                    className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-1 font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Delivery Schedule: <strong className="text-slate-800">{shipment.deliverySchedule}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
