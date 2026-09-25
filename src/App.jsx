import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import { UserPlus, LogIn, Sparkles, Truck, ShieldCheck } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'login'
  const [currentUser, setCurrentUser] = useState(null);
  const [prefilledName, setPrefilledName] = useState('');

  // Restore session from localStorage on load
  useEffect(() => {
    const savedSession = localStorage.getItem('smart_rural_session');
    if (savedSession) {
      try {
        setCurrentUser(JSON.parse(savedSession));
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }, []);

  const handleRegisterSuccess = (registeredName) => {
    setPrefilledName(registeredName);
    setActiveTab('login');
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('smart_rural_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smart_rural_session');
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navigation Header */}
      <Navbar currentUser={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {currentUser ? (
          /* Logged In Dashboard View */
          <Dashboard user={currentUser} />
        ) : (
          /* Auth Portal (Register & Login) */
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Top Toggle Switch */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register (Farmer / Operator)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Login (Name & Password)</span>
              </button>
            </div>

            {/* Active Auth View */}
            {activeTab === 'register' ? (
              <RegisterForm
                onRegisterSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => setActiveTab('login')}
              />
            ) : (
              <LoginForm
                prefilledName={prefilledName}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setActiveTab('register')}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700">Rural Link</span>
            <span>— Smart Rural Transport and Logistic Optimisation</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Built for Rural Mobility & Agricultural Freight Optimisation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
