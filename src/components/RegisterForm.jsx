import React, { useState } from 'react';
import { 
  Sprout, 
  Truck, 
  Bus, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  Lock, 
  User, 
  CreditCard, 
  Hash, 
  Weight, 
  Users 
} from 'lucide-react';
import { apiRegister } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }) {
  const { t } = useLanguage();
  // Role: 'farmer' (Farmer / Passenger) or 'operator' (Operator)
  const [role, setRole] = useState('farmer');

  // Operator Category: 'travels' or 'transport'
  const [operatorType, setOperatorType] = useState('travels');

  // Common Registration Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Operator Specific Fields
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [loadingCapacity, setLoadingCapacity] = useState('');
  const [loadingUnit, setLoadingUnit] = useState('kg');
  const [upiId, setUpiId] = useState('');

  // OTP Authentication State
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // General Form Errors / Success
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Handle OTP Generation
  const handleSendOtp = () => {
    if (!phone || phone.trim().length < 10) {
      setOtpError('Please enter a valid 10-digit phone number first.');
      return;
    }
    setOtpError('');
    // Generate a 4-digit demo OTP
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(mockOtp);
    setOtpSent(true);
    setResendCountdown(30);

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (userOtp.trim() === generatedOtp.trim()) {
      setIsPhoneVerified(true);
      setOtpError('');
    } else {
      setOtpError('Invalid OTP code. Please enter the OTP displayed above.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Common validations
    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter your phone number.');
      return;
    }
    if (!isPhoneVerified) {
      setFormError('Please complete Phone OTP verification before registering.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    // Operator specific validations
    if (role === 'operator') {
      if (!vehicleName.trim()) {
        setFormError('Please enter the vehicle name/model.');
        return;
      }
      if (!vehicleRegNo.trim()) {
        setFormError('Please enter the vehicle registration number.');
        return;
      }
      if (!upiId.trim() || !upiId.includes('@')) {
        setFormError('Please enter a valid UPI ID (e.g. yourname@bank).');
        return;
      }

      if (operatorType === 'travels') {
        if (!seatingCapacity || parseInt(seatingCapacity, 10) <= 0) {
          setFormError('Please enter a valid seating capacity.');
          return;
        }
      } else if (operatorType === 'transport') {
        if (!loadingCapacity || parseFloat(loadingCapacity) <= 0) {
          setFormError('Please enter a valid loading capacity.');
          return;
        }
      }
    }

    // Construct User Record
    const newUser = {
      id: 'USR-' + Date.now(),
      role,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password,
      operatorType: role === 'operator' ? operatorType : null,
      vehicleName: role === 'operator' ? vehicleName.trim() : null,
      vehicleRegNo: role === 'operator' ? vehicleRegNo.trim().toUpperCase() : null,
      seatingCapacity: role === 'operator' && operatorType === 'travels' ? parseInt(seatingCapacity, 10) : null,
      loadingCapacity: role === 'operator' && operatorType === 'transport' ? `${loadingCapacity} ${loadingUnit}` : null,
      upiId: role === 'operator' ? upiId.trim() : null,
      registeredAt: new Date().toISOString()
    };

    // Save to localStorage
    const existingUsers = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');
    const isDuplicate = existingUsers.some(
      u => u.name.toLowerCase() === newUser.name.toLowerCase() || u.phone === newUser.phone
    );

    if (isDuplicate) {
      setFormError('A user with this Name or Phone number already exists. Please login instead.');
      return;
    }

    existingUsers.push(newUser);
    localStorage.setItem('smart_rural_users', JSON.stringify(existingUsers));

    setFormSuccess('Registration successful! Redirecting to login...');
    setTimeout(() => {
      onRegisterSuccess(newUser.name);
    }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center">
        <h2 className="text-2xl font-bold tracking-tight">{t('register', 'Create an Account')}</h2>
        <p className="text-blue-100 text-sm mt-1">
          {t('appSubtitle', 'Join Rural Link for smart rural transport & logistics')}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {/* Step 1: Select Main Role */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            {t('chooseRole', 'Select Your Role')} <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole('farmer')}
              className={`p-4 rounded-xl border-2 text-left flex items-start space-x-3 transition-all ${
                role === 'farmer'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${role === 'farmer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{t('farmerRole', 'Farmer / Passenger')}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t('farmerRoleDesc', 'Ship farm produce or book rural passenger rides')}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole('operator')}
              className={`p-4 rounded-xl border-2 text-left flex items-start space-x-3 transition-all ${
                role === 'operator'
                  ? 'border-blue-600 bg-blue-50/80 text-blue-950 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${role === 'operator' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{t('operatorRole', 'Vehicle Operator')}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t('operatorRoleDesc', 'Travels (passenger) or Transport (freight)')}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Step 1.5: If Operator, Select Travels vs Transport */}
        {role === 'operator' && (
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Operator Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  operatorType === 'travels'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-medium shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="operatorType"
                  value="travels"
                  checked={operatorType === 'travels'}
                  onChange={() => setOperatorType('travels')}
                  className="sr-only"
                />
                <Bus className={`w-4 h-4 mr-2 ${operatorType === 'travels' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm">Travels</div>
                  <div className="text-[11px] text-slate-500 font-normal">Passenger rides & vans</div>
                </div>
              </label>

              <label
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  operatorType === 'transport'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-medium shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="operatorType"
                  value="transport"
                  checked={operatorType === 'transport'}
                  onChange={() => setOperatorType('transport')}
                  className="sr-only"
                />
                <Truck className={`w-4 h-4 mr-2 ${operatorType === 'transport' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-sm">Transport</div>
                  <div className="text-[11px] text-slate-500 font-normal">Produce freight & cargo</div>
                </div>
              </label>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              You will use this name to login after registration.
            </p>
          </div>

          {/* Email ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ramesh@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Phone Number + OTP Authentication */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Phone Number & OTP Authentication <span className="text-rose-500">*</span></span>
              </label>
              {isPhoneVerified && (
                <span className="flex items-center space-x-1 text-xs text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-medium">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  disabled={isPhoneVerified}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className={`w-full pl-11 pr-3 py-2 text-sm border rounded-lg outline-none ${
                    isPhoneVerified
                      ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                      : 'border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white'
                  }`}
                />
              </div>

              {!isPhoneVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCountdown > 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                >
                  {resendCountdown > 0 ? `Resend (${resendCountdown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              )}
            </div>

            {/* OTP Demo Simulator Alert */}
            {otpSent && !isPhoneVerified && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-900">
                  <span className="font-semibold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    SMS Gateway Simulation:
                  </span>
                  <span className="bg-amber-200 font-mono px-2 py-0.5 rounded text-amber-950 font-bold tracking-wider">
                    OTP: {generatedOtp}
                  </span>
                </div>
                <div className="flex space-x-2 pt-1">
                  <input
                    type="text"
                    maxLength={4}
                    value={userOtp}
                    onChange={(e) => setUserOtp(e.target.value)}
                    placeholder="Enter 4-digit OTP"
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-amber-300 rounded font-mono text-center tracking-widest outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition-colors"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <p className="text-xs text-rose-600 flex items-center mt-1">
                <AlertCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                {otpError}
              </p>
            )}
          </div>

          {/* Operator Specific Form Fields */}
          {role === 'operator' && (
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                {operatorType === 'travels' ? <Bus className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                <span>Operator Vehicle & Settlement Details ({operatorType})</span>
              </div>

              {/* Vehicle Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name / Model of Vehicle <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder={operatorType === 'travels' ? 'e.g. Force Traveller / Mahindra Cruiser' : 'e.g. Tata Ace Gold / Mahindra Bolero Pickup'}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Vehicle Registration Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Registration Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={vehicleRegNo}
                    onChange={(e) => setVehicleRegNo(e.target.value.toUpperCase())}
                    placeholder="e.g. KA-05-AB-1234"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg uppercase tracking-wider font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Capacity: Seating (Travels) OR Loading (Transport) */}
              {operatorType === 'travels' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seating Capacity <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={seatingCapacity}
                      onChange={(e) => setSeatingCapacity(e.target.value)}
                      placeholder="e.g. 12 (Passenger seats)"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Loading Capacity <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Weight className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        required
                        value={loadingCapacity}
                        onChange={(e) => setLoadingCapacity(e.target.value)}
                        placeholder="e.g. 1500 or 1.5"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <select
                      value={loadingUnit}
                      onChange={(e) => setLoadingUnit(e.target.value)}
                      className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="kg">kg</option>
                      <option value="Tons">Tons</option>
                      <option value="Quintals">Quintals</option>
                    </select>
                  </div>
                </div>
              )}

              {/* UPI ID for Payments */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPI ID for Direct Payments <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. drivername@okhdfcbank or 9876543210@paytm"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Used for automated fare settlements and cargo freight payments.
                </p>
              </div>
            </div>
          )}

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Error & Success Messages */}
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-blue-50 border border-blue-300 rounded-lg text-xs text-blue-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>{t('completeRegistration', 'Complete Registration')}</span>
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-200 pt-4">
          {t('alreadyRegistered', 'Already registered?')}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 font-semibold hover:underline"
          >
            {t('loginTab', 'Login with your Name & Password')}
          </button>
        </div>
      </div>
    </div>
  );
}
