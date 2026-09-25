import React, { useState } from 'react';
import { 
  Sprout, 
  Truck, 
  Bus, 
  CreditCard, 
  Hash, 
  Users, 
  Weight, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  PlusCircle, 
  Route, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import NavigationControls from './NavigationControls';
import ProfileModal from './ProfileModal';
import PassengerDashboard from './PassengerDashboard';
import FarmerLink from './FarmerLink';

export default function Dashboard({ user, onUpdateUser }) {
  const isFarmer = user.role === 'farmer';
  const isOperator = user.role === 'operator';
  const isTravels = isOperator && user.operatorType === 'travels';
  const isTransport = isOperator && user.operatorType === 'transport';

  // Navigation History state for Back/Forward controls
  const [history, setHistory] = useState(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Current view: 'home' | 'passenger' | 'farmer-link'
  const currentView = history[historyIndex] || 'home';

  // Current Location state (Defaults to Karnataka village: Maddur, Mandya)
  const [currentLocation, setCurrentLocation] = useState(user.location || 'Maddur, Mandya');

  // Profile Modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Navigation handler
  const navigateTo = (view) => {
    if (view === currentView) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(view);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleLocationChange = (newLoc) => {
    setCurrentLocation(newLoc);
    if (onUpdateUser) {
      onUpdateUser({ ...user, location: newLoc });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Farmer / Passenger Specific Navigation Controls (Profile, Home, Back/Forward, Loc, Farmer Link) */}
      {isFarmer && (
        <NavigationControls
          currentView={currentView}
          onNavigate={navigateTo}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          currentLocation={currentLocation}
          onChangeLocation={handleLocationChange}
          onOpenProfile={() => setIsProfileOpen(true)}
          userName={user.name}
        />
      )}

      {/* Render Subviews based on currentView */}
      {isFarmer && currentView === 'passenger' ? (
        <PassengerDashboard
          currentLocation={currentLocation}
          currentUser={user}
        />
      ) : isFarmer && currentView === 'farmer-link' ? (
        <FarmerLink
          currentLocation={currentLocation}
          currentUser={user}
        />
      ) : (
        /* Home Overview Screen */
        <>
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 bg-indigo-950/70 border border-indigo-400/40 px-3 py-1 rounded-full text-xs font-semibold text-sky-300 mb-3">
                  {isFarmer && <Sprout className="w-3.5 h-3.5 text-emerald-400" />}
                  {isTravels && <Bus className="w-3.5 h-3.5 text-sky-300" />}
                  {isTransport && <Truck className="w-3.5 h-3.5 text-sky-300" />}
                  <span className="uppercase tracking-wider">
                    {isFarmer ? 'Rural Link • Farmer & Passenger Portal' : `Rural Link • Operator Portal: ${user.operatorType?.toUpperCase()}`}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Namaste, {user.name}!
                </h1>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl">
                  {isFarmer
                    ? `Current Base: ${currentLocation}. Search rural bus departures, track live vehicles, or pool farm freight to Karnataka Mandis.`
                    : isTravels
                    ? 'Manage your passenger routes, assign available seats, and collect digital fares via UPI.'
                    : 'Optimize your cargo load capacity, eliminate empty return trips (backhaul), and receive direct freight bookings.'}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl text-xs space-y-1.5 min-w-[220px]">
                <div className="font-semibold text-sky-300 uppercase tracking-wider text-[11px] mb-1">
                  Account Summary
                </div>
                <div className="flex items-center text-white space-x-2">
                  <Phone className="w-3.5 h-3.5 text-sky-300" />
                  <span>+91 {user.phone}</span>
                </div>
                <div className="flex items-center text-white space-x-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-sky-300 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center text-white space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span className="truncate">{currentLocation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* If Operator: Show Registered Vehicle & Settlement Card */}
          {isOperator && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                    {isTravels ? <Bus className="w-5 h-5 text-indigo-600" /> : <Truck className="w-5 h-5 text-blue-600" />}
                    <span>Registered Vehicle & Settlement Information</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Details verified during your registration process
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                  Active Fleet
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Vehicle Model
                  </span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    {user.vehicleName || 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span>Registration No.</span>
                  </span>
                  <span className="text-sm font-bold font-mono text-blue-700 mt-1 block">
                    {user.vehicleRegNo || 'N/A'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {isTravels ? (
                    <>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>Seating Capacity</span>
                      </span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {user.seatingCapacity} Passengers
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                        <Weight className="w-3 h-3 text-slate-400" />
                        <span>Loading Capacity</span>
                      </span>
                      <span className="text-sm font-bold text-slate-800 mt-1 block">
                        {user.loadingCapacity}
                      </span>
                    </>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
                    <CreditCard className="w-3 h-3 text-slate-400" />
                    <span>UPI ID (Settlements)</span>
                  </span>
                  <span className="text-sm font-bold text-indigo-700 mt-1 block truncate">
                    {user.upiId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Farmer / Passenger Core Feature Cards on Home */}
          {isFarmer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Passenger Dashboard Quick Launcher */}
              <div 
                onClick={() => navigateTo('passenger')}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
                      <Bus className="w-6 h-6" />
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-200">
                      Live Telemetry & Seats
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Passenger Transit Dashboard
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Search buses departing from <strong>{currentLocation}</strong> across Karnataka routes. Check real-time seat availability, live bus location on map, view optimal roads, and book seats online via UPI or Cash on Boarding.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Open Passenger Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Farmer Link Quick Launcher */}
              <div 
                onClick={() => navigateTo('farmer-link')}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                      Produce Freight & Pooling
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Farmer Link (Krishi Freight)
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Post your harvest pickup requests (Sugarcane, Silk, Vegetables), match with empty return mini-trucks, join community freight pools to split costs, and view daily Karnataka APMC Mandi price tickers.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Open Farmer Link</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* Karnataka Rural Corridor Highlights */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Karnataka Rural Mobility Network Updates
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                All Corridors Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800 block">NH-275 Mandya-Mysuru</span>
                <span className="text-[11px] text-emerald-600">Smooth transit • 4 Grama Sarige buses live</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800 block">Tumakuru-Tiptur Belt</span>
                <span className="text-[11px] text-blue-600">APMC Copra freight dispatch active</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-800 block">Ramanagara Silk Corridor</span>
                <span className="text-[11px] text-indigo-600">Evening rural shuttles running on schedule</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Modal with Edit Option */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(updated) => {
          if (onUpdateUser) onUpdateUser(updated);
          if (updated.location) setCurrentLocation(updated.location);
        }}
      />
    </div>
  );
}
