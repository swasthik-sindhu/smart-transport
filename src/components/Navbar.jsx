import React from 'react';
import { Truck, Network, ShieldCheck, LogOut, UserCheck, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ currentUser, onLogout }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-blue-700 to-indigo-600 p-2.5 rounded-xl flex items-center justify-center shadow-md">
            <Truck className="w-5 h-5 text-white" />
            <Network className="w-3.5 h-3.5 text-sky-300 -ml-1 -mt-2" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                {t('appName', 'Rural Link')}
              </span>
              <span className="text-xs bg-indigo-950 text-sky-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-700/60">
                {t('appSubtitle', 'Logistics & Transit')}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t('appTagline', 'Smart Rural Transport and Logistic Optimisation')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Switcher (Always available near Profile / Header) */}
          <div 
            className="flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700/80 shadow-inner"
            title={language === 'en' ? 'Switch to Kannada / ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ' : 'Switch to English'}
          >
            <div className="px-1.5 text-sky-400 flex items-center">
              <Languages className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('kn')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'kn'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white flex items-center justify-end space-x-1">
                  <span>{currentUser.name}</span>
                  <UserCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-xs text-slate-400 capitalize">
                  {currentUser.role === 'farmer' 
                    ? t('farmerPassenger', 'Farmer / Passenger') 
                    : `${t('operator', 'Operator')} (${currentUser.operatorType})`}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('logout', 'Logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>{t('hackathonPrototype', 'Hackathon Prototype v1.0')}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
