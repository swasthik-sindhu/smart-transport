import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Home, 
  Bus, 
  Truck, 
  Sprout, 
  MapPin, 
  User, 
  ChevronDown, 
  LocateFixed, 
  Loader2, 
  Check,
  Languages
} from 'lucide-react';
import { KARNATAKA_LOCATIONS } from '../data/karnatakaRoutes';
import { useLanguage } from '../context/LanguageContext';

export default function NavigationControls({
  currentView,
  onNavigate,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  currentLocation,
  onChangeLocation,
  onOpenProfile,
  userName,
  userRole,
  operatorType
}) {
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const { language, setLanguage, t } = useLanguage();

  // Strict role and view-based link separation
  const isTravelsRole = userRole === 'operator' && operatorType === 'travels';
  const isTransportRole = userRole === 'operator' && operatorType === 'transport';

  // 1. In passenger dashboard (or farmer role), traveller/transporter operator links must NOT be there.
  // 2. In traveller dashboard (or travels role), farmer and passenger link must NOT be there.
  // 3. In transporter dashboard (or transport role), travels, passenger, and farmer links must NOT be there.
  const showPassenger = !isTravelsRole && !isTransportRole && currentView !== 'travels' && currentView !== 'transporter';
  const showFarmer = !isTravelsRole && !isTransportRole && currentView !== 'travels' && currentView !== 'transporter';
  const showTravels = (isTravelsRole || currentView === 'travels') && currentView !== 'passenger' && currentView !== 'farmer-link' && currentView !== 'transporter' && userRole !== 'farmer';
  const showTransporter = (isTransportRole || currentView === 'transporter') && currentView !== 'passenger' && currentView !== 'farmer-link' && currentView !== 'travels' && userRole !== 'farmer';

  // Handle Real Live Location via Browser Geolocation API
  const handleDetectLiveLocation = (e) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsStatus('Acquiring GPS fix...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Find nearest Karnataka hub or use reverse geocoding
        let closestLocation = KARNATAKA_LOCATIONS[0];
        let minDistance = Number.MAX_VALUE;

        KARNATAKA_LOCATIONS.forEach((loc) => {
          const dist = Math.sqrt(
            Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestLocation = loc;
          }
        });

        // Set to live detected location
        const detectedName = `${closestLocation.name}, ${closestLocation.district} (GPS Live)`;
        onChangeLocation(detectedName);
        setIsDetectingGps(false);
        setGpsStatus('Live GPS Detected ✓');
        setTimeout(() => setGpsStatus(''), 3000);
      },
      (error) => {
        console.warn('GPS detection failed or permission denied', error);
        setIsDetectingGps(false);
        // Fallback default to Kukke Subrahmanya
        onChangeLocation('Kukke Subrahmanya, Dakshina Kannada');
        setGpsStatus('Set to Kukke Subrahmanya');
        setTimeout(() => setGpsStatus(''), 3000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 mb-6 flex flex-wrap items-center justify-between gap-3">
      {/* Left: History & Core Navigation Tabs */}
      <div className="flex items-center space-x-1.5 flex-wrap gap-y-2">
        {/* Back / Forward Controls */}
        <div className="flex items-center bg-slate-100 rounded-xl p-1 mr-1 border border-slate-200">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Go Back"
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Go Forward"
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:text-slate-300 disabled:hover:bg-transparent transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Home Option */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            currentView === 'home'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t('home', 'Home')}</span>
        </button>

        {/* Passenger Dashboard Option */}
        {showPassenger && (
          <button
            onClick={() => onNavigate('passenger')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'passenger'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{t('passengerDashboard', 'Passenger Dashboard')}</span>
          </button>
        )}

        {/* Farmer Link Option */}
        {showFarmer && (
          <button
            onClick={() => onNavigate('farmer-link')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'farmer-link'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('farmerLink', 'Farmer Link')}</span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full font-bold ml-1">
              {t('freight', 'Freight')}
            </span>
          </button>
        )}

        {/* Travels Operator Dashboard Option */}
        {showTravels && (
          <button
            onClick={() => onNavigate('travels')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'travels'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-800 hover:bg-indigo-50'
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('travelsDashboard', 'Travels Dashboard')}</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-900 px-1.5 py-0.2 rounded-full font-bold ml-1">
              {t('operator', 'Operator')}
            </span>
          </button>
        )}

        {/* Transporter Operator Dashboard Option */}
        {showTransporter && (
          <button
            onClick={() => onNavigate('transporter')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentView === 'transporter'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('transporterDashboard', 'Transporter Dashboard')}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold ml-1">
              {t('freight', 'Freight')}
            </span>
          </button>
        )}
      </div>

      {/* Right: Current Live Location & Profile */}
      <div className="flex items-center space-x-2.5 flex-wrap">
        {/* Real Live GPS Location Trigger & Dropdown */}
        <div className="relative group">
          <div className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Live Loc:</span>
            <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[170px]">
              {currentLocation}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Quick Location Switcher Dropdown */}
          <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 hidden group-hover:block max-h-72 overflow-y-auto">
            {/* GPS Live Detect Action */}
            <div className="px-3 pb-2 mb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={isDetectingGps}
                className="w-full py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
              >
                {isDetectingGps ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                    <span>Detect My Live GPS Location</span>
                  </>
                )}
              </button>
              {gpsStatus && (
                <div className="text-[10px] text-emerald-600 font-semibold text-center mt-1">
                  {gpsStatus}
                </div>
              )}
            </div>

            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Coastal & Malnad Corridors (Featured)
            </div>
            <button
              onClick={() => onChangeLocation('Kukke Subrahmanya, Dakshina Kannada')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between font-semibold"
            >
              <span>Kukke Subrahmanya</span>
              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">Temple Hub</span>
            </button>
            <button
              onClick={() => onChangeLocation('Dharmasthala, Dakshina Kannada')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between font-semibold"
            >
              <span>Dharmasthala</span>
              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1 rounded">Netravati Hub</span>
            </button>
            <button
              onClick={() => onChangeLocation('Mangalore (Mangaluru), Dakshina Kannada')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between font-semibold"
            >
              <span>Mangalore (Mangaluru)</span>
              <span className="text-[10px] text-slate-400">CBS</span>
            </button>

            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1">
              All Karnataka Hubs
            </div>
            {KARNATAKA_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => onChangeLocation(`${loc.name}, ${loc.district}`)}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
              >
                <span>{loc.name}</span>
                <span className="text-[10px] text-slate-400">{loc.district}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Button with Edit Indicator */}
        <button
          onClick={onOpenProfile}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="max-w-[90px] truncate">{userName || t('profile', 'Profile')}</span>
          <span className="text-[10px] text-blue-600 bg-blue-100 px-1 py-0.5 rounded font-normal">
            {t('edit', 'Edit')}
          </span>
        </button>

        {/* Language Switcher Option (Given near the Profile) */}
        <div 
          className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 shadow-sm"
          title={language === 'en' ? 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}
        >
          <div className="pl-1.5 pr-1 text-slate-500 flex items-center">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              language === 'en'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('kn')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
              language === 'kn'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>
    </div>
  );
}
