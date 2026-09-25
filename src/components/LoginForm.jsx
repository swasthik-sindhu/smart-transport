import React, { useState } from 'react';
import { User, Lock, AlertCircle, LogIn, Sparkles, Sprout, Truck, Bus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LoginForm({ prefilledName = '', onLoginSuccess, onSwitchToRegister }) {
  const { t } = useLanguage();
  const [name, setName] = useState(prefilledName);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle Login with Name & Password
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your registered Name.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    // Retrieve users from localStorage
    const savedUsers = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');

    // Search user by name (case-insensitive) or phone or email
    const matchedUser = savedUsers.find(
      (u) =>
        u.name.toLowerCase() === name.trim().toLowerCase() ||
        u.phone === name.trim() ||
        u.email.toLowerCase() === name.trim().toLowerCase()
    );

    if (!matchedUser) {
      setError('No account found with this Name. Please check spelling or register first.');
      return;
    }

    if (matchedUser.password !== password) {
      setError('Incorrect password. Please try again.');
      return;
    }

    // Login successful
    onLoginSuccess(matchedUser);
  };

  // Demo accounts helper to fast-track hackathon testing
  const loadDemoAccount = (demoType) => {
    let demoUser;
    if (demoType === 'farmer') {
      demoUser = {
        id: 'DEMO-FARMER-1',
        role: 'farmer',
        name: 'Ramesh Patel',
        phone: '9876543210',
        email: 'ramesh.farmer@rurallink.in',
        password: 'password123',
        operatorType: null,
        vehicleName: null,
        vehicleRegNo: null,
        seatingCapacity: null,
        loadingCapacity: null,
        upiId: null,
        registeredAt: new Date().toISOString()
      };
    } else if (demoType === 'travels') {
      demoUser = {
        id: 'DEMO-TRAVELS-1',
        role: 'operator',
        name: 'Suresh Kumar',
        phone: '9845012345',
        email: 'suresh.travels@rurallink.in',
        password: 'password123',
        operatorType: 'travels',
        vehicleName: 'Force Cruiser Rural Maxi',
        vehicleRegNo: 'KA-04-E-4589',
        seatingCapacity: 12,
        loadingCapacity: null,
        upiId: 'sureshtravels@okaxis',
        registeredAt: new Date().toISOString()
      };
    } else {
      demoUser = {
        id: 'DEMO-CARGO-1',
        role: 'operator',
        name: 'Balaji Transport Co.',
        phone: '9741234567',
        email: 'balaji.cargo@rurallink.in',
        password: 'password123',
        operatorType: 'transport',
        vehicleName: 'Tata Ace Gold (Chota Hathi)',
        vehicleRegNo: 'KA-05-MH-8842',
        seatingCapacity: null,
        loadingCapacity: '1.2 Tons (1200 kg)',
        upiId: 'balajitransport@upi',
        registeredAt: new Date().toISOString()
      };
    }

    setName(demoUser.name);
    setPassword('password123');

    // Also persist into existing users if not there
    const savedUsers = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');
    if (!savedUsers.some(u => u.name.toLowerCase() === demoUser.name.toLowerCase())) {
      savedUsers.push(demoUser);
      localStorage.setItem('smart_rural_users', JSON.stringify(savedUsers));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-md mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center">
        <h2 className="text-2xl font-bold tracking-tight">{t('loginToRuralLink', 'Welcome Back')}</h2>
        <p className="text-blue-100 text-sm mt-1">
          {t('loginTab', 'Login using your registered Name and Password')}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('fullName', 'Registered Name')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('fullName', 'Enter your exact registered name')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              (Phone / Email / Name)
            </p>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                {t('password', 'Password')} <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password', 'Enter your account password')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{t('login', 'Login to Dashboard')}</span>
          </button>
        </form>

        {/* Quick Demo Credentials Switcher for Hackathon Judges */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('quickDemoAccounts', 'Quick Demo Login Accounts')}:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => loadDemoAccount('farmer')}
              className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-[11px] text-slate-700 text-center transition-colors"
            >
              <Sprout className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <div className="font-semibold truncate">{t('farmerRole', 'Farmer')}</div>
              <div className="text-[10px] text-slate-400">Ramesh</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoAccount('travels')}
              className="p-2 border border-slate-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 text-[11px] text-slate-700 text-center transition-colors"
            >
              <Bus className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
              <div className="font-semibold truncate">{t('travelsDashboard', 'Travels')}</div>
              <div className="text-[10px] text-slate-400">Suresh</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoAccount('transport')}
              className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 text-[11px] text-slate-700 text-center transition-colors"
            >
              <Truck className="w-4 h-4 text-blue-600 mx-auto mb-1" />
              <div className="font-semibold truncate">{t('transporterDashboard', 'Transport')}</div>
              <div className="text-[10px] text-slate-400">Balaji Cargo</div>
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="mt-6 text-center text-xs text-slate-600">
          {t('needAccount', 'New user?')}{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 font-semibold hover:underline"
          >
            {t('register', 'Create an Account (Register)')}
          </button>
        </div>
      </div>
    </div>
  );
}
