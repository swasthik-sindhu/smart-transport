import React from 'react';
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
  Route 
} from 'lucide-react';

export default function Dashboard({ user }) {
  const isFarmer = user.role === 'farmer';
  const isOperator = user.role === 'operator';
  const isTravels = isOperator && user.operatorType === 'travels';
  const isTransport = isOperator && user.operatorType === 'transport';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-950/70 border border-indigo-400/40 px-3 py-1 rounded-full text-xs font-medium text-sky-300 mb-3">
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
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              {isFarmer
                ? 'Manage your agricultural produce freight, pool truck loads with nearby farmers, or find rural passenger rides.'
                : isTravels
                ? 'Manage your passenger routes, assign available seats, and collect digital fares via UPI.'
                : 'Optimize your cargo load capacity, eliminate empty return trips (backhaul), and receive direct freight bookings.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-xl text-xs space-y-1.5 min-w-[220px]">
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
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
              <span>Joined: {new Date(user.registeredAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Vehicle Specification Card */}
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

      {/* Role-Specific Quick Actions & Workflow Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {isFarmer ? (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-3">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Post Produce Freight Request</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Specify crop (Tomatoes, Wheat, Onions), weight in quintals, and destination Mandi.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                Request Pickup
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Co-operative Freight Pooling</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Group your small load with 3 other nearby farmers in your village to split vehicle cost by 60%.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold">
                Find Nearby Pools
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 mb-3">
                  <Bus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Book Rural Passenger Ride</h3>
                <p className="text-xs text-slate-500 mt-1">
                  View scheduled rural vans and buses traveling between your village and the tehsil town.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">
                View Departures
              </button>
            </div>
          </>
        ) : isTravels ? (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-3">
                  <Route className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Publish Scheduled Route</h3>
                <p className="text-xs text-slate-500 mt-1">
                  List your daily morning/evening route between rural clusters and the nearest railway/town.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold">
                Create Route
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Seat Occupancy Monitor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Current capacity: {user.seatingCapacity} seats. Real-time boarding tracker and passenger tokens.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold">
                View Passenger Manifest
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">UPI Fare Settlement</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Direct instant payment routing into <span className="font-mono text-slate-700">{user.upiId}</span>.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                Generate Payment QR
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-3">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Broadcast Empty Return Leg (Backhaul)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Returning empty from Mandi? Offer discounted freight to local farmers on your return corridor.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                Broadcast Return Space
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-3">
                  <Weight className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Capacity Utilization</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Vehicle: {user.vehicleName} ({user.loadingCapacity}). Route optimization to maximize trip payloads.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold">
                Manage Load Schedule
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Freight Settlements</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automated payouts to {user.upiId} upon verified harvest delivery at destination hub.
                </p>
              </div>
              <button className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold">
                View Earnings Ledger
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
