import React, { useState } from 'react';
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
  AlertCircle 
} from 'lucide-react';
import { KARNATAKA_LOCATIONS } from '../data/karnatakaRoutes';

export default function FarmerLink({ currentLocation, currentUser }) {
  const [cropType, setCropType] = useState('Sugarcane');
  const [weightQuintals, setWeightQuintals] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetMandi, setTargetMandi] = useState('Mandya APMC Market');
  const [poolingEnabled, setPoolingEnabled] = useState(true);
  const [postedSuccess, setPostedSuccess] = useState(false);

  // Active community pools in Karnataka
  const activePools = [
    {
      id: 'POOL-KA-01',
      village: 'Gejjalagere, Mandya',
      destination: 'Mandya APMC Mandi',
      crop: 'Sugarcane & Jaggery',
      currentLoad: '18 Quintals (2 Farmers joined)',
      vehicleAssigned: 'Tata 407 (Capacity: 35 Quintals)',
      costSaving: '45% Freight Discount',
      departureTime: 'Tomorrow, 06:30 AM'
    },
    {
      id: 'POOL-KA-02',
      village: 'Honganoor, Ramanagara',
      destination: 'Ramanagara Silk Cocoon Market',
      crop: 'Silk Cocoons & Vegetables',
      currentLoad: '8 Quintals (3 Farmers joined)',
      vehicleAssigned: 'Mahindra Bolero Pickup',
      costSaving: '55% Freight Discount',
      departureTime: 'Today, 04:00 PM'
    },
    {
      id: 'POOL-KA-03',
      village: 'Gubbi Rural, Tumakuru',
      destination: 'Tiptur Copra APMC',
      crop: 'Copra & Coconuts',
      currentLoad: '22 Quintals (2 Farmers joined)',
      vehicleAssigned: 'Tractor Trolley Hub',
      costSaving: '40% Freight Discount',
      departureTime: 'Tomorrow, 07:00 AM'
    }
  ];

  const handlePostRequest = (e) => {
    e.preventDefault();
    setPostedSuccess(true);
    setTimeout(() => setPostedSuccess(false), 4000);
    setWeightQuintals('');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 mb-3">
            <Sprout className="w-3.5 h-3.5 text-amber-300" />
            <span>Farmer Link • Agricultural Supply Chain & Freight Pooling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Connect Your Harvest Directly to Karnataka Mandis
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1.5">
            Post produce freight requests, share mini-truck loads with neighbouring farmers in your taluk, and save up to 60% on vehicle hiring costs.
          </p>
        </div>
      </div>

      {/* Grid: Post Freight Request Form + Mandi Tickers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Request Produce Pickup */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Post New Farm Freight Request</span>
            </h2>
            <p className="text-xs text-slate-500">
              Matched automatically with empty return trucks and local transport operators
            </p>
          </div>

          {postedSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Freight request published! Nearby transport operators and co-op pools have been notified.
              </span>
            </div>
          )}

          <form onSubmit={handlePostRequest} className="space-y-4 text-xs">
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
                  <option value="Sugarcane">Sugarcane (ಕಬ್ಬು)</option>
                  <option value="Tomatoes">Tomatoes (ಟೊಮೇಟೊ)</option>
                  <option value="Silk Cocoons">Silk Cocoons (ರೇಷ್ಮೆ)</option>
                  <option value="Tender Coconut">Tender Coconut (ಎಳನೀರು)</option>
                  <option value="Ragi">Ragi / Millets (ರಾಗಿ)</option>
                  <option value="Paddy / Rice">Paddy / Rice (ಭತ್ತ)</option>
                  <option value="Coffee & Pepper">Coffee & Spices (ಕಾಫಿ)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimated Weight (Quintals) <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 15 Quintals (1500 kg)"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pickup Farm Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-emerald-600" />
                  <input
                    type="text"
                    disabled
                    value={currentLocation || 'Maddur, Mandya'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Destination APMC Mandi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetMandi}
                  onChange={(e) => setTargetMandi(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Mandya APMC Market">Mandya APMC Sugar & Jaggery Market</option>
                  <option value="Ramanagara Silk Market">Ramanagara Silk Cocoon Market</option>
                  <option value="Tiptur Copra APMC">Tiptur Coconut APMC Mandi</option>
                  <option value="Mysuru Bandipalya APMC">Mysuru Bandipalya Main APMC</option>
                  <option value="Yeshwanthpur APMC">Bengaluru Yeshwanthpur APMC</option>
                  <option value="Belagavi APMC">Belagavi APMC Vegetable Market</option>
                </select>
              </div>
            </div>

            {/* Freight Pooling Checkbox */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-3">
              <input
                type="checkbox"
                id="pooling"
                checked={poolingEnabled}
                onChange={(e) => setPoolingEnabled(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="pooling" className="cursor-pointer">
                <span className="font-bold text-amber-950 block">
                  Enable Collaborative Freight Pooling (Recommended)
                </span>
                <span className="text-[11px] text-amber-800 block">
                  If another farmer in your taluk is shipping to the same Mandi, Rural Link combines your loads on a shared vehicle to save fuel and cut your cost by 50%.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Truck className="w-4 h-4" />
              <span>Broadcast Freight Request to Operators</span>
            </button>
          </form>
        </div>

        {/* Right Column: Karnataka Mandi Rate Tickers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Karnataka APMC Live Prices</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time daily mandi arrivals and rates
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Sugarcane (Grade A)</span>
                <span className="text-[10px] text-slate-400">Mandya Sugar Hub</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700">₹3,150</span>
                <span className="text-[10px] text-slate-400 block">/ ton</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Silk Cocoons (CSR)</span>
                <span className="text-[10px] text-slate-400">Ramanagara Mandi</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700">₹580</span>
                <span className="text-[10px] text-slate-400 block">/ kg</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Tender Coconut</span>
                <span className="text-[10px] text-slate-400">Maddur Market</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700">₹32</span>
                <span className="text-[10px] text-slate-400 block">/ nut</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Copra (Milling)</span>
                <span className="text-[10px] text-slate-400">Tiptur APMC</span>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-emerald-700">₹11,400</span>
                <span className="text-[10px] text-slate-400 block">/ quintal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Village Freight Pools */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Active Karnataka Village Freight Pools (Join & Save)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Co-operative truck trips currently assembling nearby in your district
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
            3 Active Pools
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activePools.map((pool) => (
            <div key={pool.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between text-xs space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-blue-700">{pool.id}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pool.costSaving}
                  </span>
                </div>
                <div className="font-bold text-slate-800 text-sm mt-1">{pool.village}</div>
                <div className="text-slate-500 flex items-center space-x-1 mt-0.5">
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold text-slate-700">{pool.destination}</span>
                </div>

                <div className="mt-2.5 p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                  <div>Crop: <span className="font-semibold text-slate-800">{pool.crop}</span></div>
                  <div>Load: <span className="font-semibold text-blue-700">{pool.currentLoad}</span></div>
                  <div>Vehicle: <span className="text-slate-600">{pool.vehicleAssigned}</span></div>
                  <div>Departure: <span className="font-semibold text-emerald-700">{pool.departureTime}</span></div>
                </div>
              </div>

              <button className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs transition-colors">
                Request to Join This Pool
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
