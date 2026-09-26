import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Truck, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  PlusCircle, 
  Users, 
  Scale, 
  ArrowRight, 
  Search, 
  Compass, 
  Clock, 
  Phone, 
  Navigation, 
  ShieldCheck, 
  Filter, 
  Radio, 
  QrCode, 
  Banknote, 
  CreditCard,
  AlertTriangle,
  Trash2,
  Ban,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { fetchFreightVehicles, raiseFreightRequest, fetchFarmerFreightRequests, apiCancelFreightRequest } from '../services/api';
import GoodsLiveMapModal from './GoodsLiveMapModal';
import FreightBookingModal from './FreightBookingModal';
import { useLanguage } from '../context/LanguageContext';

// Major Karnataka APMC Mandis & Agricultural Markets
export const KARNATAKA_MANDIS = [
  { id: 'mangalore-apmc', name: 'Mangalore Baikampady APMC', district: 'Dakshina Kannada', specialty: 'Arecanut, Coconuts, Spices & Marine' },
  { id: 'dharmasthala-mandi', name: 'Dharmasthala Rural Produce Market', district: 'Dakshina Kannada', specialty: 'Jaggery, Pepper, Arecanut' },
  { id: 'mandya-apmc', name: 'Mandya APMC Sugar & Jaggery Market', district: 'Mandya', specialty: 'Sugarcane, Jaggery, Paddy' },
  { id: 'ramanagara-silk', name: 'Ramanagara Silk Cocoon Market (Asia’s Largest)', district: 'Ramanagara', specialty: 'Silk Cocoons (CSR/CB), Mangoes' },
  { id: 'tiptur-apmc', name: 'Tiptur Copra APMC', district: 'Tumakuru', specialty: 'Copra, Tender Coconut, Desiccated Coconut' },
  { id: 'yeshwanthpur-apmc', name: 'Bengaluru Yeshwanthpur APMC', district: 'Bengaluru Urban', specialty: 'Onion, Potato, Grains, Vegetables' },
  { id: 'mysuru-bandipalya', name: 'Mysuru Bandipalya APMC', district: 'Mysuru', specialty: 'Pulses, Millets, Vegetables' },
  { id: 'belagavi-apmc', name: 'Belagavi APMC Vegetable Market', district: 'Belagavi', specialty: 'Tomatoes, Green Chillies, Ginger' }
];

export default function FarmerLink({ currentLocation, currentUser }) {
  const { language, t } = useLanguage();
  // Tabs: 'search-vehicles' | 'raise-request' | 'track-goods'
  const [activeTab, setActiveTab] = useState('search-vehicles');

  // Destination Market Selection
  const [selectedMandi, setSelectedMandi] = useState(KARNATAKA_MANDIS[0].name);

  // Available Freight Vehicles (from transport dashboard / backend)
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSearchFilter, setVehicleSearchFilter] = useState('');
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState(null);

  // Raise Request Form State
  const [cropType, setCropType] = useState('Arecanut & Coconuts');
  const [weightQuintals, setWeightQuintals] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [deliveryWindow, setDeliveryWindow] = useState('Morning Mandi Auction (06:00 AM - 09:00 AM)');
  const [handlingNotes, setHandlingNotes] = useState('Dry produce, moisture-proof tarpaulin required');
  const [requestPaymentMethod, setRequestPaymentMethod] = useState('upi'); // 'upi' | 'cash_on_pickup'
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSuccessMessage, setReqSuccessMessage] = useState('');

  // Active Goods Shipments & Live Tracking
  const [myShipments, setMyShipments] = useState([]);
  const [selectedShipmentForTracking, setSelectedShipmentForTracking] = useState(null);
  const [shipmentToCancel, setShipmentToCancel] = useState(null);
  const [isCancellingShipment, setIsCancellingShipment] = useState(false);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState('');

  // Load Vehicles & Farmer Requests with 4-second auto-poll for multi-device sync
  useEffect(() => {
    loadVehicles();
    loadShipments();

    const interval = setInterval(() => {
      loadShipments();
      loadVehicles();
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedMandi, currentLocation]);

  const loadVehicles = async () => {
    setIsLoadingVehicles(true);
    const data = await fetchFreightVehicles(currentLocation, selectedMandi);
    setVehicles(data);
    setIsLoadingVehicles(false);
  };

  const loadShipments = async () => {
    const data = await fetchFarmerFreightRequests();
    setMyShipments(data);
  };

  // Cancel Freight Shipment Handler (Restores truck capacity in SQLite)
  const handleExecuteCancelShipment = async () => {
    if (!shipmentToCancel) return;
    setIsCancellingShipment(true);
    try {
      await apiCancelFreightRequest(shipmentToCancel.id);
      setCancelSuccessMessage(`Consignment #${shipmentToCancel.id} cancelled. Truck capacity (${shipmentToCancel.weightQuintals} Quintals) restored to operator fleet.`);
      setMyShipments(prev => prev.map(s => s.id === shipmentToCancel.id ? { ...s, status: 'CANCELLED', paymentStatus: 'CANCELLED (Refund Processed)' } : s));
      setShipmentToCancel(null);
      loadShipments();
      loadVehicles(); // refresh vehicle capacity
      setTimeout(() => setCancelSuccessMessage(''), 5000);
    } catch (err) {
      alert('Error cancelling consignment: ' + err.message);
    } finally {
      setIsCancellingShipment(false);
    }
  };

  const handleRemoveCancelledShipment = (shipmentId) => {
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    const filtered = saved.filter(s => s.id !== shipmentId);
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(filtered));
    setMyShipments(prev => prev.filter(s => s.id !== shipmentId));
  };

  // Submit Freight Request
  const handleRaiseRequest = async (e) => {
    e.preventDefault();
    if (!weightQuintals || parseFloat(weightQuintals) <= 0) {
      alert('Please enter a valid produce load capacity in Quintals.');
      return;
    }

    setIsSubmittingReq(true);
    try {
      const estimatedRate = 42;
      const totalFreight = Math.round(parseFloat(weightQuintals) * estimatedRate);

      const payload = {
        farmerName: currentUser?.name || 'Ramesh Patel',
        farmerPhone: currentUser?.phone || '9876543210',
        cropType,
        weightQuintals: parseFloat(weightQuintals),
        pickupLocation: currentLocation || 'Kukke Subrahmanya Farm Yard',
        targetMandi: selectedMandi,
        deliverySchedule: `${deliveryDate} • ${deliveryWindow}`,
        paymentMethod: requestPaymentMethod,
        totalFreight,
        paymentStatus: requestPaymentMethod === 'upi' ? 'PAID via UPI' : 'PENDING (Cash on Pickup)',
        handlingNotes
      };

      const created = await raiseFreightRequest(payload);
      setMyShipments(prev => [created, ...prev]);
      setReqSuccessMessage(`Freight Request ${created.id} broadcasted! Transport operators have been notified.`);
      setWeightQuintals('');
      setIsSubmittingReq(false);

      setTimeout(() => {
        setReqSuccessMessage('');
        setActiveTab('track-goods');
      }, 1600);
    } catch (err) {
      alert('Error raising request: ' + err.message);
      setIsSubmittingReq(false);
    }
  };

  // Filter vehicles
  const displayedVehicles = vehicles.filter(v => {
    if (!vehicleSearchFilter.trim()) return true;
    const q = vehicleSearchFilter.toLowerCase();
    return (
      v.vehicleName.toLowerCase().includes(q) ||
      v.driverName.toLowerCase().includes(q) ||
      v.vehicleType.toLowerCase().includes(q) ||
      v.baseLocation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 mb-3">
            <Sprout className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('farmerPortalTitle', 'Farmer Link • Agricultural Supply Chain & Freight Mobility')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t('farmerPortalTitle', 'Farm to Mandi Freight & Telemetry')}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1.5">
            {t('farmerPortalSubtitle', 'Select your destination market, search available transport vehicles near you, raise freight pickup requests, and track your goods and their direction in real-time.')}
          </p>
        </div>

        {/* 3 Core Workflow Tabs */}
        <div className="mt-6 flex items-center space-x-2 bg-black/20 p-1.5 rounded-2xl max-w-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('search-vehicles')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'search-vehicles'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t('availableTrucks', '1. Available Vehicles')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('raise-request')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'raise-request'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('postFreightRequest', '2. Raise Request')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('track-goods')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'track-goods'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-emerald-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{t('myBookings', '3. Booked Shipments & Live Tracking')}</span>
            {myShipments.filter(s => s.status !== 'CANCELLED').length > 0 && (
              <span className="bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full text-[10px] font-black ml-1">
                {myShipments.filter(s => s.status !== 'CANCELLED').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Consignment Overview Notification */}
      {myShipments.filter(s => s.status !== 'CANCELLED').length > 0 && activeTab !== 'track-goods' && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5 text-xs text-emerald-950 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>
              You have {myShipments.filter(s => s.status !== 'CANCELLED').length} active booked produce shipment(s) in transit.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('track-goods')}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>View Booked Info & Track</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Target Destination Market & Farm Pickup Location Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left: Choose Destination Mandi */}
        <div className="flex items-center space-x-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 flex-shrink-0 shadow-sm">
            <MapPin className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Destination APMC Mandi
            </span>
            <select
              value={selectedMandi}
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="w-full font-bold text-sm text-slate-900 bg-transparent focus:outline-none cursor-pointer truncate"
            >
              {KARNATAKA_MANDIS.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} ({m.district})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Farm Pickup Location (Strictly current location) */}
        <div className="flex items-center space-x-3 bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm relative">
            <Navigation className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
              Farm Pickup Location (Current Location)
            </span>
            <div className="font-bold text-sm text-emerald-950 truncate" title={currentLocation || 'Kukke Subrahmanya, Dakshina Kannada'}>
              {currentLocation || 'Kukke Subrahmanya, Dakshina Kannada'}
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: SEARCH AVAILABLE FREIGHT VEHICLES */}
      {activeTab === 'search-vehicles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Freight Vehicles Operating in Your Area</span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct trucks, pickups, and tractors heading towards {selectedMandi}
              </p>
            </div>

            {/* Quick Filter Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={vehicleSearchFilter}
                onChange={(e) => setVehicleSearchFilter(e.target.value)}
                placeholder="Search truck, driver, model..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedVehicles.map((veh) => (
              <div
                key={veh.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-base text-slate-900">{veh.vehicleName}</span>
                    <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {veh.vehicleRegNo}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 mb-3 flex items-center space-x-2">
                    <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                      {veh.vehicleType}
                    </span>
                    <span>• {veh.operatorName}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 mb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Available Capacity:</span>
                      <span className="font-extrabold text-emerald-700 text-sm">{veh.availableCapacityQuintals} Quintals Space</span>
                      {veh.isShared && (
                        <span className="text-[10px] text-emerald-900 font-bold bg-emerald-100 px-1.5 py-0.5 rounded block mt-0.5 w-fit">
                          Shared Load Available
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Rate / Quintal:</span>
                      <span className="font-extrabold text-slate-800 text-sm">₹{veh.ratePerQuintal}</span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate" title={veh.upiId}>
                        UPI: {veh.upiId || 'transporter@upi'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block">Corridor & Route:</span>
                      <span className="font-semibold text-slate-800">{veh.viaRoute || 'State Highway Freight Corridor'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Base Corridor:</span>
                      <span className="font-semibold text-slate-700">{veh.baseLocation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Dispatch Schedule:</span>
                      <span className="font-semibold text-slate-700">{veh.departureSchedule}</span>
                    </div>
                  </div>

                  {/* Accepted Crops if specified */}
                  {veh.allowedGoods && veh.allowedGoods.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] text-slate-400 block mb-1">Transporter Accepts:</span>
                      <div className="flex flex-wrap gap-1">
                        {veh.allowedGoods.slice(0, 4).map((g, idx) => (
                          <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-950 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                            {typeof g === 'string' ? g.split(' (')[0] : g}
                          </span>
                        ))}
                        {veh.allowedGoods.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-bold self-center">
                            +{veh.allowedGoods.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Driver: <strong>{veh.driverName}</strong> (+91 {veh.driverPhone})</span>
                    </div>
                    <span className="text-amber-600 font-bold text-[11px]">★ {veh.rating}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
                  <a
                    href={`tel:${veh.driverPhone}`}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>

                  {/* Open Freight Booking Modal with UPI & Cash Options */}
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleForBooking(veh)}
                    className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors text-center"
                  >
                    Book Freight (UPI / Cash)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RAISE PRODUCE FREIGHT PICKUP REQUEST */}
      {activeTab === 'raise-request' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4 mb-5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Raise Farm Freight Pickup Request</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify your harvest capacity and required delivery schedule. Transport operators will dispatch to your farm.
            </p>
          </div>

          {reqSuccessMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{reqSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={handleRaiseRequest} className="space-y-4 text-xs">
            {/* Crop Type & Produce Load Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Crop / Commodity Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Arecanut & Coconuts">Arecanut & Coconuts (ಅಡಿಕೆ / ತೆಂಗು)</option>
                  <option value="Tender Coconut">Tender Coconut (ಎಳನೀರು)</option>
                  <option value="Sugarcane">Sugarcane (ಕಬ್ಬು)</option>
                  <option value="Tomatoes & Vegetables">Tomatoes & Vegetables (ತರಕಾರಿ)</option>
                  <option value="Silk Cocoons">Silk Cocoons (ರೇಷ್ಮೆ ಗೂಡು)</option>
                  <option value="Coffee & Pepper">Coffee & Pepper (ಕಾಫಿ / ಕರಿಮೆಣಸು)</option>
                  <option value="Paddy / Rice">Paddy / Rice (ಭತ್ತ)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Produce Load Capacity (Quintals) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={weightQuintals}
                    onChange={(e) => setWeightQuintals(e.target.value)}
                    placeholder="e.g. 12.5 Quintals (1250 kg)"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">1 Quintal = 100 kg</span>
              </div>
            </div>

            {/* Farm Pickup Location & Destination Mandi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between text-xs">
                  <span>Farm Pickup Location <span className="text-emerald-700 font-bold">(Your Current Location)</span></span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full">Auto-Fixed (GPS)</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600 animate-pulse" />
                  <input
                    type="text"
                    readOnly
                    value={currentLocation || 'Kukke Subrahmanya, Dakshina Kannada'}
                    className="w-full pl-9 pr-3 py-2 bg-emerald-50/60 border border-emerald-300 text-emerald-950 font-bold rounded-lg text-sm cursor-default shadow-sm"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Transport driver will be dispatched directly to this pickup location.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between text-xs">
                  <span>Destination Mandi Market</span>
                  <span className="text-[10px] text-slate-600 bg-slate-100 font-medium px-2 py-0.5 rounded-full">Wholesale Mandi</span>
                </label>
                <div className="relative">
                  <Navigation className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    readOnly
                    value={selectedMandi}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-lg text-sm cursor-default shadow-sm truncate"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Chosen destination wholesale auction center.
                </span>
              </div>
            </div>

            {/* When it needs to be delivered */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
              <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>When Does it Need to be Delivered? <span className="text-rose-500">*</span></span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Mandi Auction Window</label>
                  <select
                    value={deliveryWindow}
                    onChange={(e) => setDeliveryWindow(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    <option value="Early Morning Auction (05:00 AM - 08:00 AM)">Early Morning Auction (05:00 AM - 08:00 AM)</option>
                    <option value="Morning Mandi Auction (08:00 AM - 11:00 AM)">Morning Mandi Auction (08:00 AM - 11:00 AM)</option>
                    <option value="Afternoon Consignment (01:00 PM - 04:00 PM)">Afternoon Consignment (01:00 PM - 04:00 PM)</option>
                    <option value="Evening Wholesale Trading (05:00 PM - 08:00 PM)">Evening Wholesale Trading (05:00 PM - 08:00 PM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD: UPI vs CASH ON PICKUP */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Choose Payment Option <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-start p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    requestPaymentMethod === 'upi'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestPaymentMethod"
                    value="upi"
                    checked={requestPaymentMethod === 'upi'}
                    onChange={() => setRequestPaymentMethod('upi')}
                    className="sr-only"
                  />
                  <div className="p-2 rounded-xl bg-emerald-600 text-white mr-2.5 flex-shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">UPI (Instant)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Pay via QR / GPay / PhonePe</div>
                  </div>
                </label>

                <label
                  className={`flex items-start p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    requestPaymentMethod === 'cash_on_pickup'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestPaymentMethod"
                    value="cash_on_pickup"
                    checked={requestPaymentMethod === 'cash_on_pickup'}
                    onChange={() => setRequestPaymentMethod('cash_on_pickup')}
                    className="sr-only"
                  />
                  <div className="p-2 rounded-xl bg-amber-600 text-white mr-2.5 flex-shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Cash on Pickup</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Pay driver during loading</div>
                  </div>
                </label>
              </div>

              {requestPaymentMethod === 'upi' ? (
                <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant UPI escrow settlement upon harvest weighing at the Mandi.</span>
                </div>
              ) : (
                <div className="p-2.5 bg-white border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center space-x-2">
                  <Banknote className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Pay cash directly to the driver when the freight truck arrives at your farm.</span>
                </div>
              )}
            </div>

            {/* Handling Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Special Handling & Transport Notes
              </label>
              <input
                type="text"
                value={handlingNotes}
                onChange={(e) => setHandlingNotes(e.target.value)}
                placeholder="e.g. Moisture sensitive bags, urgent delivery for morning Mandi auction"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingReq}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {isSubmittingReq ? (
                <span>Publishing Request...</span>
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  <span>Raise Request & Notify Transport Fleet</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LIVE GOODS TRACKING & DIRECTION MONITOR */}
      {activeTab === 'track-goods' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" />
                <span>Booked Harvest Shipments & Live Telemetry</span>
              </h2>
              <p className="text-xs text-slate-500">
                Track exactly where your agricultural produce is, view assigned driver info, and monitor transit direction
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full self-start sm:self-auto">
              {myShipments.filter(s => s.status !== 'CANCELLED').length} Active Consignment{myShipments.filter(s => s.status !== 'CANCELLED').length !== 1 ? 's' : ''}
            </span>
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

          <div className="space-y-4">
            {myShipments.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500 space-y-2">
                <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-semibold text-sm">No active harvest shipments found.</p>
                <p className="text-xs text-slate-400">Book an available vehicle in Tab 1 or raise a freight request in Tab 2 to dispatch your produce.</p>
              </div>
            ) : (
              myShipments.map((shipment) => {
                const isCancelled = shipment.status === 'CANCELLED';

                return (
                  <div
                    key={shipment.id}
                    className={`rounded-3xl p-6 shadow-sm border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                      isCancelled
                        ? 'bg-slate-50/80 border-slate-200 opacity-90'
                        : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    {/* Left Column: Shipment Overview */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`font-extrabold text-base ${isCancelled ? 'line-through text-slate-500' : 'text-slate-900'}`}>{shipment.cropType}</span>
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          Ref #{shipment.id}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                          {shipment.weightQuintals} Quintals
                        </span>
                        {isCancelled ? (
                          <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center space-x-1">
                            <Ban className="w-3 h-3 mr-0.5" />
                            <span>CANCELLED (Capacity Restored)</span>
                          </span>
                        ) : (
                          <>
                            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full animate-pulse">
                              {shipment.status}
                            </span>
                            <span className="text-xs bg-emerald-100 text-emerald-900 font-medium px-2 py-0.5 rounded">
                              {shipment.paymentStatus || 'PAID via UPI'}
                            </span>
                          </>
                        )}
                        {shipment.totalFreight && (
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Freight: ₹{shipment.totalFreight}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="inline-flex items-center space-x-1.5 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pickup: <strong className="text-slate-900">{shipment.pickupLocation}</strong></span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="inline-flex items-center space-x-1.5 font-medium text-slate-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Mandi: <strong className="text-emerald-900">{shipment.targetMandi}</strong></span>
                        </span>
                      </div>

                      {/* Real-time Telemetry & Direction Card */}
                      {isCancelled ? (
                        <div className="p-3.5 bg-rose-950/90 border border-rose-500/50 rounded-2xl text-xs space-y-1 text-white shadow-inner">
                          <div className="flex items-center space-x-1.5 text-rose-300 font-bold">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                            <span>Freight Consignment Cancelled • Vehicle Capacity Restored</span>
                          </div>
                          <div className="text-[11px] text-rose-200">
                            Truck capacity of {shipment.weightQuintals} Quintals released back to the fleet. Full refund credited.
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center space-x-2 text-emerald-950 font-bold">
                            <Compass className="w-4 h-4 text-emerald-700" />
                            <span>Direction: </span>
                            <span className="text-blue-700">{shipment.liveTelemetry?.direction}</span>
                          </div>

                          <div className="flex items-center space-x-4 text-[11px] text-slate-600 pt-1">
                            <div>Current Location: <strong className="text-slate-800">{shipment.liveTelemetry?.currentLocationName}</strong></div>
                            <div>Speed: <strong className="text-slate-800">{shipment.liveTelemetry?.speedKm} km/h</strong></div>
                            <div>ETA: <strong className="text-emerald-700">{shipment.liveTelemetry?.etaMinutes} mins</strong></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Assigned Driver & Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 min-w-[230px] pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div className="text-left lg:text-right text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Assigned Driver & Vehicle</span>
                        <span className="font-bold text-slate-800">{shipment.assignedVehicle?.driverName}</span>
                        <span className="font-mono text-slate-500 block text-[11px]">{shipment.assignedVehicle?.vehicleRegNo} ({shipment.assignedVehicle?.vehicleName})</span>
                        {shipment.assignedVehicle?.driverPhone && (
                          <span className="text-[10px] text-emerald-700 font-mono flex items-center lg:justify-end space-x-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{shipment.assignedVehicle.driverPhone}</span>
                          </span>
                        )}
                      </div>

                      <div className="w-full flex items-center space-x-2">
                        {!isCancelled ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedShipmentForTracking(shipment)}
                              className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <Navigation className="w-4 h-4" />
                              <span>Track Live</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShipmentToCancel(shipment)}
                              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                              title="Cancel freight booking and release vehicle capacity"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveCancelledShipment(shipment.id)}
                            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                            title="Dismiss from list"
                          >
                            Remove Cancelled Shipment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Freight Booking Modal with UPI & Cash on Pickup */}
      {selectedVehicleForBooking && (
        <FreightBookingModal
          isOpen={!!selectedVehicleForBooking}
          onClose={() => setSelectedVehicleForBooking(null)}
          vehicle={selectedVehicleForBooking}
          currentLocation={currentLocation}
          selectedMandi={selectedMandi}
          currentUser={currentUser}
          onFreightBooked={(created) => {
            setMyShipments(prev => [created, ...prev]);
            setActiveTab('track-goods');
          }}
        />
      )}

      {/* Live Goods Map & Direction Modal */}
      {selectedShipmentForTracking && (
        <GoodsLiveMapModal
          isOpen={!!selectedShipmentForTracking}
          onClose={() => setSelectedShipmentForTracking(null)}
          shipment={selectedShipmentForTracking}
        />
      )}

      {/* Cancel Freight Consignment Modal */}
      {shipmentToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Cancel Freight Consignment?</h3>
                  <p className="text-xs text-rose-200 font-mono">Ref #{shipmentToCancel.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShipmentToCancel(null)}
                disabled={isCancellingShipment}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-1.5">
                <div className="font-bold text-sm text-slate-900">
                  {shipmentToCancel.cropType} ({shipmentToCancel.weightQuintals} Quintals)
                </div>
                <div className="text-[11px] text-slate-600">
                  Route: <span className="font-semibold text-slate-800">{shipmentToCancel.pickupLocation}</span> ➔ <span className="font-semibold text-slate-800">{shipmentToCancel.targetMandi}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Assigned Carrier: <span className="font-semibold text-slate-800">{shipmentToCancel.assignedVehicle?.vehicleName}</span> ({shipmentToCancel.assignedVehicle?.vehicleRegNo})
                </div>
                {shipmentToCancel.totalFreight && (
                  <div className="text-[11px] text-slate-600">
                    Freight Amount: <span className="font-bold text-rose-700">₹{shipmentToCancel.totalFreight}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Truck Capacity Restored:</strong> {shipmentToCancel.weightQuintals} Quintals load capacity will be automatically released back to the driver's vehicle fleet.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Full Refund Processed:</strong> Any advance freight paid via UPI or escrow will be instantly reversed.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Driver Notification:</strong> Driver {shipmentToCancel.assignedVehicle?.driverName} will be informed of consignment cancellation.</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Are you sure you want to cancel this produce transport booking?
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShipmentToCancel(null)}
                disabled={isCancellingShipment}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Keep Consignment
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelShipment}
                disabled={isCancellingShipment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                {isCancellingShipment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Cancellation...</span>
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
