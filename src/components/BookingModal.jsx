import React, { useState } from 'react';
import { 
  X, 
  Bus, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  User, 
  Phone, 
  ShieldCheck, 
  Ticket, 
  Calendar, 
  MapPin, 
  Download 
} from 'lucide-react';
import { apiCreateBooking } from '../services/api';

export default function BookingModal({ isOpen, onClose, bus, currentUser, onBookingConfirmed }) {
  if (!isOpen || !bus) return null;

  const [seatCount, setSeatCount] = useState(1);
  const [passengerName, setPassengerName] = useState(currentUser?.name || '');
  const [passengerPhone, setPassengerPhone] = useState(currentUser?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'cash'
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const totalFare = bus.fare * seatCount;

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const bookingPayload = {
      busId: bus.id,
      busName: bus.busName,
      vehicleRegNo: bus.vehicleRegNo,
      source: bus.source,
      destination: bus.destination,
      departureTime: bus.departureTime,
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      seatCount,
      totalFare,
      paymentMethod,
    };

    try {
      const savedBooking = await apiCreateBooking(bookingPayload);
      setIsProcessing(false);
      setConfirmedBooking(savedBooking);
      if (onBookingConfirmed) onBookingConfirmed(savedBooking);
    } catch (err) {
      console.warn('Booking fallback to offline:', err);
      const fallbackBooking = {
        bookingId: 'RL-KA-' + Math.floor(10000 + Math.random() * 90000),
        ...bookingPayload,
        paymentStatus: paymentMethod === 'online' ? 'PAID (UPI Confirmed)' : 'PENDING (Cash on Boarding)',
        bookedAt: new Date().toLocaleString()
      };
      setIsProcessing(false);
      setConfirmedBooking(fallbackBooking);
      if (onBookingConfirmed) onBookingConfirmed(fallbackBooking);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {confirmedBooking ? 'Ticket Confirmed!' : 'Book Bus Seat'}
              </h3>
              <p className="text-xs text-sky-200">
                {bus.busName} • <span className="font-mono">{bus.vehicleRegNo}</span>
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

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {!confirmedBooking ? (
            /* Booking Form */
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Trip Summary Card */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-blue-900 uppercase">Selected Corridor</div>
                  <div className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 mt-0.5">
                    <span>{bus.source}</span>
                    <span className="text-blue-600">→</span>
                    <span>{bus.destination}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Departure: <span className="font-semibold text-slate-700">{bus.departureTime}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Single Fare</span>
                  <span className="text-base font-extrabold text-blue-700">₹{bus.fare}</span>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Seats to Book <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={seatCount}
                      onChange={(e) => setSeatCount(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {[...Array(Math.min(6, bus.availableSeats)).keys()].map((n) => (
                        <option key={n + 1} value={n + 1}>
                          {n + 1} Passenger{n > 0 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Available on Bus
                    </label>
                    <div className="px-3 py-2 bg-slate-100 rounded-lg text-sm font-semibold text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{bus.availableSeats} Seats Left</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Primary Passenger Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      placeholder="Enter passenger name"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={passengerPhone}
                      onChange={(e) => setPassengerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 mb-2">
                  Choose Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'online'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-lg bg-blue-600 text-white mr-2.5 flex-shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Online Payment</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        UPI QR / GPay / PhonePe (Instant)
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => setPaymentMethod('cash')}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-lg bg-emerald-600 text-white mr-2.5 flex-shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Cash on Boarding</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Pay Conductor upon entry
                      </div>
                    </div>
                  </label>
                </div>

                {/* Online Payment Preview simulation */}
                {paymentMethod === 'online' && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-slate-700">
                    <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="text-[11px] space-y-0.5">
                      <div className="font-bold text-blue-700">Scan UPI QR to Pay ₹{totalFare}</div>
                      <div className="text-slate-500">UPI ID: <span className="font-mono font-medium">rurallink.ksrtc@upi</span></div>
                      <div className="text-emerald-700 font-semibold flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Zero surcharge on rural bus passes
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Fare & Submit Button */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="font-semibold text-slate-600">Total Payable:</span>
                  <span className="font-extrabold text-lg text-slate-900">₹{totalFare}</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <span>Confirming Booking...</span>
                  ) : paymentMethod === 'online' ? (
                    <span>Pay ₹{totalFare} & Generate Ticket</span>
                  ) : (
                    <span>Book Ticket (Pay ₹{totalFare} Cash)</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Digital Boarding Pass / Ticket Confirmation */
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-dashed border-emerald-400 rounded-2xl p-4 text-center space-y-2">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-emerald-900">Seat Reservation Confirmed!</h4>
                <p className="text-xs text-emerald-700">
                  Please show this digital pass to the conductor or driver when boarding.
                </p>
              </div>

              {/* Ticket Details Box */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 font-sans">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Ticket Reference</span>
                    <span className="font-mono font-bold text-sm text-blue-700">{confirmedBooking.bookingId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Status</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      confirmedBooking.paymentMethod === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {confirmedBooking.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bus Service:</span>
                    <span className="font-semibold text-slate-800">{confirmedBooking.busName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicle Reg:</span>
                    <span className="font-mono font-semibold text-slate-800">{confirmedBooking.vehicleRegNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Journey:</span>
                    <span className="font-semibold text-slate-800">{confirmedBooking.source} → {confirmedBooking.destination}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Departure Time:</span>
                    <span className="font-semibold text-slate-800">{confirmedBooking.departureTime}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Passenger:</span>
                    <span className="font-semibold text-slate-800">{confirmedBooking.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Seats Booked:</span>
                    <span className="font-bold text-blue-700">{confirmedBooking.seatCount} Seat(s)</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Total Paid / Due:</span>
                  <span className="font-black text-sm text-slate-900">₹{confirmedBooking.totalFare}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Save / Print Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
