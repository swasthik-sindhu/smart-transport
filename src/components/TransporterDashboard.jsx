import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Clock, 
  Scale, 
  Users, 
  Radio, 
  Compass, 
  ShieldCheck, 
  PlusCircle, 
  CheckCircle2, 
  LocateFixed, 
  Loader2, 
  RotateCw, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  TrendingUp, 
  Phone, 
  AlertCircle,
  Eye,
  Percent,
  Split,
  Sprout,
  Check,
  X,
  FileText,
  DollarSign,
  Bell,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import { 
  KARNATAKA_LOCATIONS, 
  calculateDistance 
} from '../data/karnatakaRoutes';
import { KARNATAKA_MANDIS } from './FarmerLink';
import { 
  createTransportTask, 
  fetchTransportTasks, 
  updateTransportTelemetry, 
  fetchTransporterRequests, 
  acceptFreightRequest, 
  rejectFreightRequest, 
  updateFreightRequestStatus 
} from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Suggested Agricultural Produce from Farmer Dashboard
const SUGGESTED_GOODS = [
  { id: 'arecanut-coconut', name: 'Arecanut & Coconuts (ಅಡಿಕೆ / ತೆಂಗು)', icon: '🥥' },
  { id: 'tomatoes-veg', name: 'Tomatoes & Vegetables (ತರಕಾರಿ)', icon: '🍅' },
  { id: 'tender-coconut', name: 'Tender Coconut (ಎಳನೀರು)', icon: '🌴' },
  { id: 'sugarcane', name: 'Sugarcane (ಕಬ್ಬು)', icon: '🌾' },
  { id: 'paddy-rice', name: 'Paddy / Rice (ಭತ್ತ)', icon: '🌾' },
  { id: 'silk-cocoons', name: 'Silk Cocoons (ರೇಷ್ಮೆ ಗೂಡು)', icon: '🐛' },
  { id: 'coffee-pepper', name: 'Coffee & Pepper (ಕಾಫಿ / ಕರಿಮೆಣಸು)', icon: '☕' },
  { id: 'fruits-banana', name: 'Fruits & Bananas (ಹಣ್ಣುಗಳು)', icon: '🍌' },
  { id: 'potatoes-onions', name: 'Potatoes & Onions (ಆಲೂಗಡ್ಡೆ / ಈರುಳ್ಳಿ)', icon: '🥔' }
];

export default function TransporterDashboard({ currentUser, currentLocation }) {
  const { language, t } = useLanguage();
  // Transporter identity from profile or defaults
  const operatorName = currentUser?.name || 'Balaji Transport Co.';
  const driverName = currentUser?.name || 'Manjunath Gowda';
  const driverPhone = currentUser?.phone || '9741234567';
  const vehicleName = currentUser?.vehicleName || 'Tata Ace Gold (Chota Hathi)';
  const vehicleRegNo = currentUser?.vehicleRegNo || 'KA-19-MH-8842';
  const initialCapacity = currentUser?.loadingCapacity ? parseFloat(currentUser.loadingCapacity) || 20 : 20;
  const initialUpiId = currentUser?.upiId || 'balajitransport@upi';
  const operatorId = currentUser?.id || 'DEMO-CARGO-1';

  // Active Tasks
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Task Creation Form State
  const [baseLocation, setBaseLocation] = useState(currentLocation?.split(',')[0] || 'Kukke Subrahmanya');
  const [destinationMarket, setDestinationMarket] = useState(KARNATAKA_MANDIS[0].name);
  const [viaRoute, setViaRoute] = useState('NH-73 via Gundya, Kokkada & Bantwal Bypass');
  const [totalCapacityQuintals, setTotalCapacityQuintals] = useState(initialCapacity);
  const [ratePerQuintal, setRatePerQuintal] = useState(45);
  const [departureSchedule, setDepartureSchedule] = useState('Today, 05:00 PM (Evening Mandi Dispatch)');
  const [transporterUpiId, setTransporterUpiId] = useState(initialUpiId);
  const [isSharedCapacity, setIsSharedCapacity] = useState(true);
  const [selectedGoods, setSelectedGoods] = useState([
    'Arecanut & Coconuts (ಅಡಿಕೆ / ತೆಂಗು)',
    'Tomatoes & Vegetables (ತರಕಾರಿ)',
    'Sugarcane (ಕಬ್ಬು)',
    'Paddy / Rice (ಭತ್ತ)'
  ]);

  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [taskSuccessMessage, setTaskSuccessMessage] = useState('');

  // Live Location & Telemetry Broadcast
  const [currentSpeedKm, setCurrentSpeedKm] = useState(40);
  const [currentCheckpoint, setCurrentCheckpoint] = useState('Starting Hub Yard • Ready for Pickup');
  const [transitStatus, setTransitStatus] = useState('Ready for Pickup');
  const [directionHeading, setDirectionHeading] = useState('Heading towards Mandi on NH-73 (Compass: 315° NW)');
  const [isUpdatingTelemetry, setIsUpdatingTelemetry] = useState(false);
  const [telemetrySuccess, setTelemetrySuccess] = useState('');

  // Incoming Farmer Requests
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'pending' | 'accepted'
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Navigation to Farm Pickup Modal State
  const [selectedRequestForPickupNav, setSelectedRequestForPickupNav] = useState(null);
  const [dismissedAlertId, setDismissedAlertId] = useState(null);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const vehicleMarkerRef = useRef(null);

  // Dynamic Route calculations
  const srcObj = useMemo(() => {
    return KARNATAKA_LOCATIONS.find(l => l.name === baseLocation) || KARNATAKA_LOCATIONS[0];
  }, [baseLocation]);

  const mandiObj = useMemo(() => {
    return KARNATAKA_MANDIS.find(m => m.name === destinationMarket) || KARNATAKA_MANDIS[0];
  }, [destinationMarket]);

  // Find nearest coordinate for mandi
  const destCoords = useMemo(() => {
    if (destinationMarket.includes('Mangalore')) return { lat: 12.8797, lng: 74.8560 };
    if (destinationMarket.includes('Bengaluru') || destinationMarket.includes('Yeshwanthpur')) return { lat: 13.0285, lng: 77.5463 };
    if (destinationMarket.includes('Mandya')) return { lat: 12.5244, lng: 76.8958 };
    if (destinationMarket.includes('Mysuru') || destinationMarket.includes('Bandipalya')) return { lat: 12.2958, lng: 76.6394 };
    if (destinationMarket.includes('Dharmasthala')) return { lat: 12.9566, lng: 75.3789 };
    if (destinationMarket.includes('Tiptur')) return { lat: 13.2564, lng: 76.4789 };
    return { lat: 12.8797, lng: 74.8560 };
  }, [destinationMarket]);

  const calculatedDistanceKm = useMemo(() => {
    return calculateDistance(srcObj.lat, srcObj.lng, destCoords.lat, destCoords.lng);
  }, [srcObj, destCoords]);

  // Auto-suggest viaRoute when start or mandi changes
  useEffect(() => {
    if (destinationMarket.includes('Mangalore')) {
      setViaRoute(`NH-73 via Gundya, Ujire Bypass & Bantwal B.C. Road`);
    } else if (destinationMarket.includes('Mandya') || destinationMarket.includes('Mysuru')) {
      setViaRoute(`NH-275 / State Highway connecting via Channapatna rural link`);
    } else if (destinationMarket.includes('Bengaluru')) {
      setViaRoute(`NH-75 Hassan-Bengaluru 4-lane freight corridor`);
    } else {
      setViaRoute(`State Highway corridor via local taluk market links`);
    }
  }, [baseLocation, destinationMarket]);

  // Load Tasks and Requests on mount and auto-poll for new farmer requests in real time
  useEffect(() => {
    loadTasks();
    loadRequests();

    const interval = setInterval(() => {
      loadRequests();
      loadTasks();
    }, 4000);

    return () => clearInterval(interval);
  }, [operatorId, vehicleRegNo, baseLocation]);

  const loadTasks = async () => {
    try {
      const data = await fetchTransportTasks(operatorId, vehicleRegNo);
      setTasks(data);
      if (data.length > 0) {
        const current = data[0];
        setActiveTask(current);
        if (current.liveLocation) {
          setCurrentSpeedKm(current.liveLocation.speedKm || 0);
          setCurrentCheckpoint(current.liveLocation.currentLocationName || `${current.baseLocation} Hub`);
          setTransitStatus(current.liveLocation.status || 'Accepting Cargo Bookings');
          setDirectionHeading(current.liveLocation.direction || `Heading towards ${current.destinationMarket}`);
        }
      }
    } catch (err) {
      console.error('Failed to load transport tasks', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadRequests = async () => {
    try {
      const reqs = await fetchTransporterRequests(vehicleRegNo, operatorName, baseLocation);
      setIncomingRequests(reqs);
    } catch (err) {
      console.error('Failed to load incoming requests', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Detect any pending request in this corridor to display high-priority approval banner
  const nearbyPendingRequest = useMemo(() => {
    return incomingRequests.find(r => 
      (r.status.includes('Pending') || r.status.includes('Requested')) &&
      r.id !== dismissedAlertId
    );
  }, [incomingRequests, dismissedAlertId]);

  // Toggle crop selection
  const handleToggleGood = (goodName) => {
    setSelectedGoods(prev => {
      if (prev.includes(goodName)) {
        return prev.filter(g => g !== goodName);
      } else {
        return [...prev, goodName];
      }
    });
  };

  // Handle Create / Publish Transport Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (selectedGoods.length === 0) {
      alert('Please select at least one produce / crop type that your vehicle can carry.');
      return;
    }
    if (!transporterUpiId || !transporterUpiId.includes('@')) {
      alert('Please provide a valid UPI ID (e.g. yourname@bank) so farmers can pay you.');
      return;
    }

    setIsSubmittingTask(true);
    const payload = {
      operatorId,
      operatorName,
      driverName,
      driverPhone,
      vehicleName,
      vehicleRegNo,
      vehicleType: `Freight Carrier (${totalCapacityQuintals} Qtl)`,
      baseLocation,
      destinationMarket,
      viaRoute,
      totalCapacityQuintals: parseFloat(totalCapacityQuintals),
      availableCapacityQuintals: parseFloat(totalCapacityQuintals),
      ratePerQuintal: parseFloat(ratePerQuintal),
      allowedGoods: selectedGoods,
      isShared: isSharedCapacity,
      sharedPricingRule: 'Proportional Load & Distance Split',
      upiId: transporterUpiId,
      departureSchedule,
      liveLocation: {
        currentLocationName: `${baseLocation} Hub Yard`,
        lat: srcObj.lat,
        lng: srcObj.lng,
        speedKm: 0,
        direction: `Heading towards ${destinationMarket} via ${viaRoute}`,
        checkpoint: 'Docked at Starting Point',
        status: 'Accepting Cargo Bookings',
        lastUpdated: new Date().toLocaleTimeString()
      }
    };

    try {
      const created = await createTransportTask(payload);
      setActiveTask(created);
      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== created.id);
        return [created, ...filtered];
      });
      setTaskSuccessMessage(`Route task published! This vehicle is now available on the Farmer Dashboard for "${baseLocation} ➔ ${destinationMarket}".`);
      setIsSubmittingTask(false);
      setTimeout(() => setTaskSuccessMessage(''), 5000);
    } catch (err) {
      alert('Error publishing task: ' + err.message);
      setIsSubmittingTask(false);
    }
  };

  // Update Telemetry
  const handleUpdateTelemetry = async (e) => {
    e.preventDefault();
    if (!activeTask) return;

    setIsUpdatingTelemetry(true);
    try {
      const telemetryPayload = {
        lat: srcObj.lat + 0.04,
        lng: srcObj.lng + 0.05,
        speedKm: currentSpeedKm,
        direction: directionHeading,
        currentLocationName: currentCheckpoint,
        checkpoint: currentCheckpoint,
        status: transitStatus
      };

      const updated = await updateTransportTelemetry(activeTask.id, telemetryPayload);
      if (updated) {
        setActiveTask(updated);
      }
      setTelemetrySuccess('Live telemetry broadcasted to farmers tracking this vehicle!');
      setTimeout(() => setTelemetrySuccess(''), 4000);
    } catch (err) {
      alert('Error updating telemetry: ' + err.message);
    } finally {
      setIsUpdatingTelemetry(false);
    }
  };

  // Accept Request (Deducts Available Capacity & Opens Navigation to Farm)
  const handleAcceptRequest = async (requestId) => {
    try {
      const updated = await acceptFreightRequest(requestId, vehicleRegNo);
      setIncomingRequests(prev => prev.map(r => r.id === requestId ? updated : r));
      // Refresh tasks immediately so capacity decrease is visible
      await loadTasks();
      // Open farm pickup navigation modal to navigate there!
      setSelectedRequestForPickupNav(updated);
    } catch (err) {
      alert('Failed to accept request: ' + err.message);
    }
  };

  // Reject Request
  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    try {
      const updated = await rejectFreightRequest(rejectModalReq.id, rejectReason);
      setIncomingRequests(prev => prev.map(r => r.id === rejectModalReq.id ? updated : r));
      setRejectModalReq(null);
      setRejectReason('');
      await loadTasks(); // refresh capacity
    } catch (err) {
      alert('Failed to reject request: ' + err.message);
    }
  };

  // Update Status to Loading at Farm / In Transit / Delivered
  const handleUpdateStatus = async (requestId, newStatus, checkpoint = '') => {
    try {
      const updated = await updateFreightRequestStatus(requestId, newStatus, checkpoint || currentCheckpoint);
      setIncomingRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Leaflet map setup for active task
  useEffect(() => {
    if (!activeTask || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const tSrc = KARNATAKA_LOCATIONS.find(l => l.name === activeTask.baseLocation) || KARNATAKA_LOCATIONS[0];
    const truckLat = activeTask.liveLocation?.lat || tSrc.lat;
    const truckLng = activeTask.liveLocation?.lng || tSrc.lng;

    const map = L.map(mapContainerRef.current).setView([truckLat, truckLng], 10);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const waypoints = [
      [tSrc.lat, tSrc.lng],
      [(tSrc.lat + destCoords.lat) / 2 + 0.015, (tSrc.lng + destCoords.lng) / 2 + 0.015],
      [destCoords.lat, destCoords.lng]
    ];

    const polyline = L.polyline(waypoints, {
      color: '#16a34a',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Origin Marker
    const originIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #059669; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">F</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([tSrc.lat, tSrc.lng], { icon: originIcon })
      .bindPopup(`<strong>Origin:</strong> ${tSrc.name} (Farm Cluster)`)
      .addTo(map);

    // Destination Mandi Marker
    const destIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">M</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
      .bindPopup(`<strong>Destination APMC:</strong> ${activeTask.destinationMarket}`)
      .addTo(map);

    // Moving Truck Marker
    const truckIcon = L.divIcon({
      className: 'custom-truck-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 38px; height: 38px; background-color: #10b981; opacity: 0.4; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background-color: #065f46; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 10;">
            🚚
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    const truckMarker = L.marker([truckLat, truckLng], { icon: truckIcon })
      .bindPopup(`
        <div style="font-family: sans-serif; min-width: 170px;">
          <div style="font-weight: bold; color: #065f46;">${activeTask.vehicleName}</div>
          <div style="font-size: 11px; color: #475569;">Reg: ${activeTask.vehicleRegNo}</div>
          <div style="font-size: 11px; color: #16a34a; font-weight: bold; margin-top: 4px;">Status: ${activeTask.liveLocation?.status || 'In Service'}</div>
          <div style="font-size: 11px; color: #0284c7;">Speed: ${activeTask.liveLocation?.speedKm || 0} km/h</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Checkpoint: ${activeTask.liveLocation?.currentLocationName || 'At Base'}</div>
        </div>
      `)
      .addTo(map);

    vehicleMarkerRef.current = truckMarker;
  }, [activeTask, destCoords]);

  // Capacity calculations for load-sharing gauge
  const totalCap = activeTask ? activeTask.totalCapacityQuintals : (parseFloat(totalCapacityQuintals) || 20);
  const availCap = activeTask ? activeTask.availableCapacityQuintals : totalCap;
  const bookedCap = Math.max(0, totalCap - availCap);
  const bookedPercentage = Math.min(100, Math.round((bookedCap / totalCap) * 100));

  // Filtered requests
  const filteredRequests = incomingRequests.filter(req => {
    if (requestFilter === 'pending') return req.status.includes('Pending') || req.status.includes('Requested');
    if (requestFilter === 'accepted') return req.status.includes('Accepted') || req.status.includes('Transit');
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Transporter Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-400/40 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-3">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('transporterTitle', 'Transporter Freight & Shared Load Dispatch Portal')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {operatorName}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              {t('transporterWelcomeDesc', 'Create route tasks, specify accepted agricultural produce, broadcast vehicle capacity sharing, accept direct farmer bookings, and collect digital freight settlements via your UPI ID.')}
            </p>
          </div>

          {/* Transporter Profile & Direct Settlement UPI ID badge */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl text-xs space-y-1.5 min-w-[240px]">
            <div className="font-semibold text-emerald-300 uppercase tracking-wider text-[11px] mb-1 flex items-center justify-between">
              <span>{t('profile', 'Transporter Fleet Info')}</span>
              <span className="bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded text-[10px]">Verified</span>
            </div>
            <div className="flex items-center text-white space-x-2">
              <Truck className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <span className="font-bold">{vehicleName}</span>
            </div>
            <div className="flex items-center text-white space-x-2">
              <span className="text-[10px] text-slate-300 uppercase font-semibold">{t('vehicleRegNo', 'Reg No')}:</span>
              <span className="font-mono font-bold text-amber-300">{vehicleRegNo}</span>
            </div>
            <div className="flex items-center text-white space-x-2 pt-1 border-t border-white/10">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-[10px] text-slate-300">{t('settlementUpi', 'UPI ID')}:</span>
              <span className="font-mono font-bold text-emerald-200 truncate">{transporterUpiId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME NEARBY REQUEST APPROVAL ALERT BANNER */}
      {nearbyPendingRequest && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-5 text-white shadow-xl animate-in slide-in-from-top-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-2 border-amber-300">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-bounce">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-black/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-100 uppercase tracking-wider mb-1">
                <Radio className="w-3 h-3 text-white animate-pulse" />
                <span>{t('nearbyAlertTitle', 'New Harvest Pickup Request in Your Corridor!')}</span>
              </div>
              <h3 className="font-extrabold text-base">
                Farmer {nearbyPendingRequest.farmerName} wants to transport {nearbyPendingRequest.weightQuintals} Quintals of {nearbyPendingRequest.cropType}
              </h3>
              <p className="text-xs text-amber-100 mt-0.5">
                Pickup Farm: <strong>{nearbyPendingRequest.pickupLocation}</strong> ➔ Target Mandi: <strong>{nearbyPendingRequest.targetMandi}</strong> • Freight Fare: <strong>₹{nearbyPendingRequest.totalFreight}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => handleAcceptRequest(nearbyPendingRequest.id)}
              className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-700" />
              <span>{t('approveAndAccept', 'Approve & Accept Load')}</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissedAlertId(nearbyPendingRequest.id)}
              className="px-3 py-2.5 bg-black/20 hover:bg-black/30 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              {t('decline', 'Dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* CAPACITY SHARING & REVENUE MATRIX */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Capacity Sharing Gauge (Updates as loads are accepted!) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Vehicle Available Capacity</span>
            </span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
              availCap > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {availCap > 0 ? `${availCap} Qtl Space Left` : 'Fully Loaded'}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${bookedPercentage}%` }} 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
            <span>Accepted Loads: <strong>{bookedCap} Quintals</strong> ({bookedPercentage}%)</span>
            <span>Total: <strong>{totalCap} Quintals</strong></span>
          </div>
          <p className="text-[11px] text-slate-400">
            {isSharedCapacity ? '✓ Multi-farmer load sharing active: Capacity updates in real-time as you accept loads.' : 'Dedicated full truck mode.'}
          </p>
        </div>

        {/* Metric 2: Shared Cost Model Explanation */}
        <div className="space-y-1.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-950 font-bold">
            <Split className="w-4 h-4 text-emerald-700" />
            <span>Shared Pricing Model (Pro-Rata)</span>
          </div>
          <p className="text-[11px] text-emerald-900 leading-relaxed">
            When multiple farmers share your truck, each pays proportionally based on:
          </p>
          <div className="bg-white/80 p-2 rounded-lg font-mono text-[10px] text-emerald-950 font-semibold border border-emerald-200">
            Fare = (Weight Qtl ÷ Total Trip Load) × Trip Base + (Dist km × ₹0.50)
          </div>
          <span className="text-[10px] text-emerald-700 block font-semibold">
            ✓ Eliminates empty return trips & cuts farmer costs by 25-35%!
          </span>
        </div>

        {/* Metric 3: Settlement Summary */}
        <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Direct Payment Settlements</span>
            </div>
            <div className="text-[11px] text-slate-600">
              UPI payments from farmers credit directly to:
            </div>
            <div className="font-mono font-bold text-xs text-emerald-800 bg-white px-2 py-1 rounded border border-slate-200 mt-1 truncate">
              {transporterUpiId}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 border-t border-slate-200 pt-1.5">
            <span>Incoming Consignments:</span>
            <span className="font-bold text-slate-900">{incomingRequests.length} Total</span>
          </div>
        </div>
      </div>

      {/* MAIN WORKFLOW: TASK CREATION & INCOMING REQUESTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CREATE / PUBLISH ROUTE TASK (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Create & Broadcast Route Task</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mention available capacity, starting to ending point, route, and accepted goods. This task appears in the Farmer Dashboard as an available vehicle in that area.
            </p>
          </div>

          {taskSuccessMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{taskSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
            {/* Row 1: Starting Point & Destination Mandi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Starting Point (Base Location) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
                  <select
                    value={baseLocation}
                    onChange={(e) => setBaseLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {KARNATAKA_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name} ({loc.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ending Point (Destination APMC Mandi) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Navigation className="w-4 h-4 absolute left-3 top-2.5 text-rose-600" />
                  <select
                    value={destinationMarket}
                    onChange={(e) => setDestinationMarket(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {KARNATAKA_MANDIS.map(mandi => (
                      <option key={mandi.id} value={mandi.name}>
                        {mandi.name} ({mandi.district})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: In which route he is going to (viaRoute) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Route Corridor & Highway Link (In which route you are going) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500">
                  Est. Distance: <strong className="text-emerald-700">{calculatedDistanceKm} km</strong>
                </span>
              </div>
              <input
                type="text"
                required
                value={viaRoute}
                onChange={(e) => setViaRoute(e.target.value)}
                placeholder="e.g. NH-73 via Gundya, Kokkada, Ujire Bypass & Bantwal B.C. Road"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            {/* Row 3: Available Capacity & Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vehicle Available Capacity (Quintals) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={totalCapacityQuintals}
                    onChange={(e) => setTotalCapacityQuintals(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 20"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  1 Quintal = 100 kg. (20 Qtl = 2.0 Tons)
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Base Rate per Quintal (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="10"
                    required
                    value={ratePerQuintal}
                    onChange={(e) => setRatePerQuintal(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. 45"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Fair Karnataka regional freight tariff
                </span>
              </div>
            </div>

            {/* Row 4: What type of goods he is carrying (Suggested from Farmer Dashboard) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">
                  Accepted Goods & Crops (Suggested from Farmer Dashboard) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700">
                  {selectedGoods.length} types selected
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {SUGGESTED_GOODS.map(g => {
                  const isChecked = selectedGoods.includes(g.name);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleToggleGood(g.name)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                        isChecked 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-semibold' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-sm">{g.icon}</span>
                      <span className="truncate text-[11px]">{g.name.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 5: Capacity Sharing Model & UPI ID for Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
              {/* Capacity Sharing Mode Toggle */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-xs flex items-center space-x-1">
                    <Split className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Capacity Sharing (Pooling)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={isSharedCapacity}
                    onChange={(e) => setIsSharedCapacity(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-emerald-800 leading-snug">
                  If capacity is not full, allow multiple farmers to share truck space. Costs share dynamically based on distance and load.
                </p>
              </div>

              {/* Transporter UPI ID */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transporter UPI ID (Direct Settlements) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={transporterUpiId}
                    onChange={(e) => setTransporterUpiId(e.target.value)}
                    placeholder="e.g. balajitransport@upi"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Farmers paying via UPI in Farmer Link will pay this ID.
                </span>
              </div>
            </div>

            {/* Row 6: Departure Schedule */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Departure Schedule
              </label>
              <input
                type="text"
                value={departureSchedule}
                onChange={(e) => setDepartureSchedule(e.target.value)}
                placeholder="e.g. Today, 05:00 PM (Evening Mandi Dispatch)"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingTask}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmittingTask ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Task...</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Publish Task to Farmer Dashboard (Available Vehicle)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE GPS MAP & TELEMETRY BROADCASTER (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Map Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Live Route GPS Telemetry</span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Broadcasting
              </span>
            </div>

            <div 
              ref={mapContainerRef} 
              className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0"
            ></div>

            {/* Telemetry Updater Form */}
            <form onSubmit={handleUpdateTelemetry} className="space-y-3 text-xs pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">Speed (km/h)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={currentSpeedKm}
                    onChange={(e) => setCurrentSpeedKm(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block">Status</label>
                  <select
                    value={transitStatus}
                    onChange={(e) => setTransitStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
                  >
                    <option value="Docked at Starting Point">Docked at Base</option>
                    <option value="Loading Produce at Farm">Loading at Farm</option>
                    <option value="In Transit on Highway">In Transit on Highway</option>
                    <option value="Arrived at Mandi Gate">Arrived at Mandi Gate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block">Current Location / Checkpoint</label>
                <input
                  type="text"
                  value={currentCheckpoint}
                  onChange={(e) => setCurrentCheckpoint(e.target.value)}
                  placeholder="e.g. Near Bantwal Highway Toll Plaza"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block">Direction Heading</label>
                <input
                  type="text"
                  value={directionHeading}
                  onChange={(e) => setDirectionHeading(e.target.value)}
                  placeholder="e.g. Heading towards Mandi on NH-73 (Compass: 315° NW)"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {telemetrySuccess && (
                <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  {telemetrySuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingTelemetry}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Broadcast Live GPS Telemetry</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SECTION: INCOMING FARMER FREIGHT REQUESTS (ACCEPT / REJECT) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <span>Incoming Farmer Freight Requests & Consignments</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Farmers in your route have booked capacity. Accept requests to deduct capacity from your truck, track farm pickup location to reach there, and collect digital settlements.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setRequestFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                requestFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({incomingRequests.length})
            </button>
            <button
              onClick={() => setRequestFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                requestFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Approval ({incomingRequests.filter(r => r.status.includes('Pending') || r.status.includes('Requested')).length})
            </button>
            <button
              onClick={() => setRequestFilter('accepted')}
              className={`px-3 py-1 rounded-lg transition-all ${
                requestFilter === 'accepted' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Accepted ({incomingRequests.filter(r => r.status.includes('Accepted') || r.status.includes('Transit')).length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {isLoadingRequests ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              <span>Loading incoming farmer bookings...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-1">
              <Truck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-sm">No incoming freight requests found for this filter.</p>
              <p className="text-xs text-slate-400">When farmers in your corridor book your truck, their consignments will appear here for your acceptance.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isPending = req.status.includes('Pending') || req.status.includes('Requested');
              const isAccepted = req.status.includes('Accepted');
              const isInTransit = req.status.includes('Transit') || req.status.includes('Loading');
              const isDelivered = req.status.includes('Delivered');
              const isRejected = req.status.includes('Rejected') || req.status.includes('CANCELLED');

              return (
                <div 
                  key={req.id}
                  className={`rounded-2xl p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isRejected 
                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                      : isPending
                      ? 'bg-amber-50/50 border-amber-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-sm'
                  }`}
                >
                  {/* Left Column: Farmer & Produce Details */}
                  <div className="space-y-2 flex-1 text-xs">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-extrabold text-sm text-slate-900">{req.cropType}</span>
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {req.id}
                      </span>
                      <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                        {req.weightQuintals} Quintals Space
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        isPending 
                          ? 'bg-amber-200 text-amber-950 animate-pulse' 
                          : isAccepted
                          ? 'bg-emerald-100 text-emerald-900'
                          : isInTransit
                          ? 'bg-sky-100 text-sky-900'
                          : isDelivered
                          ? 'bg-teal-100 text-teal-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Route Details */}
                    <div className="flex items-center space-x-2 text-slate-600 flex-wrap gap-y-1">
                      <span className="inline-flex items-center space-x-1 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>Farm Pickup: <strong>{req.pickupLocation}</strong></span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="inline-flex items-center space-x-1 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-emerald-950">
                        <Navigation className="w-3 h-3 text-emerald-700" />
                        <span>Mandi: <strong>{req.targetMandi}</strong></span>
                      </span>
                      {req.distanceReducedKm > 0 && (
                        <span className="inline-flex items-center space-x-1 font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 text-[11px]">
                          <span>🌾 Mid-Route Pickup ({req.routeDistanceKm} km • -{req.distanceReducedKm} km reduced)</span>
                        </span>
                      )}
                    </div>

                    {/* Farmer Identity & Payment */}
                    <div className="flex items-center space-x-4 text-[11px] text-slate-600 pt-1 flex-wrap gap-y-1">
                      <div>
                        Farmer: <strong className="text-slate-900">{req.farmerName}</strong>
                      </div>
                      <div className="flex items-center space-x-1 text-emerald-700 font-semibold font-mono">
                        <Phone className="w-3 h-3" />
                        <span>+91 {req.farmerPhone}</span>
                      </div>
                      <div>
                        Freight Fare: <strong className="text-slate-900">₹{req.totalFreight}</strong>
                        {req.ratePerQuintal && (
                          <span className="text-[10px] text-emerald-700 ml-1 font-bold">(₹{req.ratePerQuintal}/Qtl)</span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-700">
                        Payment: <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{req.paymentStatus}</span>
                      </div>
                    </div>

                    {req.handlingNotes && (
                      <div className="text-[11px] text-slate-500 italic">
                        Note: "{req.handlingNotes}"
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions (Accept / Reject / Track Farm Pickup) */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2 min-w-[210px] pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex flex-col space-y-1.5 w-full">
                      {isPending && (
                        <div className="flex items-center space-x-2 w-full">
                          <button
                            type="button"
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Load</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectModalReq(req)}
                            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {/* TRACK FARM PICKUP LOCATION BUTTON (For Accepted & In-Transit loads) */}
                      {(isAccepted || isInTransit) && (
                        <button
                          type="button"
                          onClick={() => setSelectedRequestForPickupNav(req)}
                          className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-amber-300" />
                          <span>Track Farm Pickup (Navigate)</span>
                        </button>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'In Transit', 'Loaded & En Route to Mandi')}
                          className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-[11px] shadow-sm transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Mark Picked Up (In Transit)</span>
                        </button>
                      )}

                      {isInTransit && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(req.id, 'Delivered at APMC Mandi', 'Delivered at Weighbridge Gate')}
                          className="w-full py-1.5 px-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-[11px] shadow-sm transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Delivered at Mandi</span>
                        </button>
                      )}

                      {isDelivered && (
                        <span className="text-xs bg-teal-100 text-teal-900 font-bold px-3 py-1 rounded-full flex items-center justify-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                          <span>Delivery Completed</span>
                        </span>
                      )}
                    </div>

                    <a
                      href={`tel:${req.farmerPhone}`}
                      className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center space-x-1 transition-colors self-end"
                    >
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>Call Farmer</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* REJECT REQUEST MODAL */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-base">Reject Consignment Request?</h3>
              </div>
              <button
                onClick={() => setRejectModalReq(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">{rejectModalReq.cropType} ({rejectModalReq.weightQuintals} Qtl)</div>
                <div className="text-[11px] text-slate-600">Farmer: {rejectModalReq.farmerName} (+91 {rejectModalReq.farmerPhone})</div>
                <div className="text-[11px] text-slate-600">Pickup: {rejectModalReq.pickupLocation}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Rejection (Optional)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Schedule mismatch, overloaded route"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="text-[11px] text-slate-500">
                Rejecting this request will keep your vehicle capacity available for other farmers and notify the farmer.
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRACK FARM PICKUP LOCATION MODAL (Navigate to reach there) */}
      {selectedRequestForPickupNav && (
        <FarmPickupNavModal
          isOpen={!!selectedRequestForPickupNav}
          onClose={() => setSelectedRequestForPickupNav(null)}
          shipment={selectedRequestForPickupNav}
          baseLocation={baseLocation}
          onStatusUpdate={handleUpdateStatus}
        />
      )}
    </div>
  );
}

// ----------------- SUBCOMPONENT: FARM PICKUP NAVIGATION MODAL ----------------- //

function FarmPickupNavModal({ isOpen, onClose, shipment, baseLocation, onStatusUpdate }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  if (!isOpen || !shipment) return null;

  // Approximate coordinates for farm pickup
  const pickupCoord = useMemo(() => {
    const matchedLoc = KARNATAKA_LOCATIONS.find(l => 
      shipment.pickupLocation && shipment.pickupLocation.toLowerCase().includes(l.name.toLowerCase())
    );
    if (matchedLoc) return { lat: matchedLoc.lat + 0.012, lng: matchedLoc.lng + 0.01 };
    return { lat: 12.6750, lng: 75.6250 };
  }, [shipment]);

  const baseCoord = useMemo(() => {
    const matchedLoc = KARNATAKA_LOCATIONS.find(l => 
      baseLocation && baseLocation.toLowerCase().includes(l.name.toLowerCase())
    );
    if (matchedLoc) return { lat: matchedLoc.lat, lng: matchedLoc.lng };
    return { lat: 12.6631, lng: 75.6158 };
  }, [baseLocation]);

  const distanceToFarm = useMemo(() => {
    return calculateDistance(baseCoord.lat, baseCoord.lng, pickupCoord.lat, pickupCoord.lng);
  }, [baseCoord, pickupCoord]);

  const etaMinutes = Math.max(12, Math.round(distanceToFarm * 2.2));

  // Map setup
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current).setView([baseCoord.lat, baseCoord.lng], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const waypoints = [
      [baseCoord.lat, baseCoord.lng],
      [(baseCoord.lat + pickupCoord.lat) / 2 + 0.005, (baseCoord.lng + pickupCoord.lng) / 2 + 0.005],
      [pickupCoord.lat, pickupCoord.lng]
    ];

    const polyline = L.polyline(waypoints, {
      color: '#059669',
      weight: 5,
      opacity: 0.9,
      dashArray: '6, 6'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // Transporter marker
    const truckIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #1e3a8a; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">🚚</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([baseCoord.lat, baseCoord.lng], { icon: truckIcon })
      .bindPopup(`<strong>Your Truck Location</strong><br/>${baseLocation}`)
      .addTo(map);

    // Farm pickup marker
    const farmIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="background-color: #d97706; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3);">🌾</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    L.marker([pickupCoord.lat, pickupCoord.lng], { icon: farmIcon })
      .bindPopup(`<strong>Farmer Pickup Yard</strong><br/>${shipment.farmerName} (${shipment.cropType})`)
      .addTo(map);

  }, [baseCoord, pickupCoord, shipment, baseLocation]);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(baseLocation)}&destination=${encodeURIComponent(shipment.pickupLocation)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Navigate to Farm Pickup Location</h3>
              <p className="text-xs text-emerald-200">
                Farmer: {shipment.farmerName} • Ref #{shipment.id}
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

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Real-time Distance & ETA Banner */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 font-bold">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>Distance to Farm: <strong className="text-slate-900">{distanceToFarm} km</strong></span>
            </div>
            <div className="flex items-center space-x-2 justify-end">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Est. Transit: <strong className="text-emerald-800">~{etaMinutes} mins</strong></span>
            </div>
          </div>

          {/* Interactive Navigation Map */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-64 rounded-2xl border border-slate-200 shadow-inner z-0"
          ></div>

          {/* Farm Pickup Information */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Farm Pickup Address</span>
                <span className="font-bold text-slate-900 text-sm">{shipment.pickupLocation}</span>
              </div>
              <a
                href={`tel:${shipment.farmerPhone}`}
                className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center space-x-1.5 text-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Farmer</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Crop to Load:</span>
                <span className="font-bold text-slate-800">{shipment.cropType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Weight:</span>
                <span className="font-bold text-slate-800">{shipment.weightQuintals} Quintals</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Mandi:</span>
                <span className="font-bold text-slate-800">{shipment.targetMandi}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Freight Amount:</span>
                <span className="font-bold text-emerald-800">₹{shipment.totalFreight} ({shipment.paymentStatus})</span>
              </div>
              {shipment.distanceReducedKm > 0 && (
                <div className="col-span-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 flex items-center justify-between">
                  <span>Corridor Route: <strong>{shipment.routeDistanceKm} km</strong> to Mandi (Mid-Route Stop • -{shipment.distanceReducedKm} km reduced)</span>
                  <span className="font-bold text-emerald-800">Fair Rate: ₹{shipment.ratePerQuintal || Math.round(shipment.totalFreight / shipment.weightQuintals)}/Qtl</span>
                </div>
              )}
            </div>

            {shipment.handlingNotes && (
              <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                Farmer notes: "{shipment.handlingNotes}"
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 text-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps (Turn-by-Turn GPS Navigation)</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onStatusUpdate(shipment.id, 'Loading Produce at Farm', 'Arrived at Farm Pickup Yard');
                  onClose();
                }}
                className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors text-center cursor-pointer"
              >
                Arrived at Farm (Loading)
              </button>

              <button
                type="button"
                onClick={() => {
                  onStatusUpdate(shipment.id, 'In Transit', 'Loaded & En Route to Mandi');
                  onClose();
                }}
                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors text-center cursor-pointer"
              >
                Depart to Mandi (In Transit)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
