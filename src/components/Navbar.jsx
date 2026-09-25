import React from 'react';
import { Truck, Network, ShieldCheck, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
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
              <span className="font-extrabold text-xl tracking-tight text-white">Rural Link</span>
              <span className="text-xs bg-indigo-950 text-sky-300 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-700/60">
                Logistics & Transit
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Smart Rural Transport and Logistic Optimisation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white flex items-center justify-end space-x-1">
                  <span>{currentUser.name}</span>
                  <UserCheck className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-xs text-slate-400 capitalize">
                  {currentUser.role === 'farmer' 
                    ? 'Farmer / Passenger' 
                    : `Operator (${currentUser.operatorType})`}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Hackathon Prototype v1.0</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
