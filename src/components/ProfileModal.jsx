import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, X, Check, Edit2, ShieldCheck, Languages } from 'lucide-react';
import { KARNATAKA_LOCATIONS } from '../data/karnatakaRoutes';
import { useLanguage } from '../context/LanguageContext';

export default function ProfileModal({ isOpen, onClose, user, onUpdateUser }) {
  if (!isOpen) return null;

  const { language: appLanguage, setLanguage: setAppLanguage, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [location, setLocation] = useState(user.location || 'Maddur, Mandya');
  const [language, setLanguage] = useState(user.language || (appLanguage === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'English'));
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      location,
      language
    };

    // Update in localStorage
    localStorage.setItem('smart_rural_session', JSON.stringify(updatedUser));
    const allUsers = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');
    const userIndex = allUsers.findIndex(u => u.id === user.id || u.phone === user.phone);
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser;
      localStorage.setItem('smart_rural_users', JSON.stringify(allUsers));
    }

    onUpdateUser(updatedUser);
    setIsEditing(false);
    setSavedMessage(t('profileUpdated', 'Profile updated successfully!'));
    setTimeout(() => setSavedMessage(''), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{user.name}</h3>
              <p className="text-xs text-sky-200">
                {user.role === 'farmer' ? 'Farmer / Passenger Profile' : `Operator (${user.operatorType})`}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {savedMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('fullName', 'Full Name')}</span>
                </span>
                <span className="font-semibold text-slate-800">{user.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('phoneNumber', 'Phone')}</span>
                </span>
                <span className="font-semibold text-slate-800">+91 {user.phone}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('emailId', 'Email')}</span>
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[180px]">{user.email}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('baseLocation', 'Base Location')}</span>
                </span>
                <span className="font-semibold text-blue-700">{location}</span>
              </div>

              {/* Language selection right here in Profile Modal */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <Languages className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('preferredLanguage', 'Preferred Language')}</span>
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAppLanguage('en');
                      setLanguage('English');
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      appLanguage === 'en'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppLanguage('kn');
                      setLanguage('ಕನ್ನಡ (Kannada)');
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${
                      appLanguage === 'kn'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t('editProfileDetails', 'Edit Profile Details')}</span>
              </button>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('fullName', 'Full Name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('phoneNumber', 'Phone Number')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('emailId', 'Email ID')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('currentVillage', 'Current Village / Taluk (Karnataka)')}</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {KARNATAKA_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={`${loc.name}, ${loc.district}`}>
                      {loc.name} ({loc.district} Dist.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('preferredLanguage', 'Preferred App Language')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('English');
                      setAppLanguage('en');
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      language === 'English' || appLanguage === 'en'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('ಕನ್ನಡ (Kannada)');
                      setAppLanguage('kn');
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                      language === 'ಕನ್ನಡ (Kannada)' || appLanguage === 'kn'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ಕನ್ನಡ (Kannada)
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
                >
                  {t('saveChanges', 'Save Changes')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
