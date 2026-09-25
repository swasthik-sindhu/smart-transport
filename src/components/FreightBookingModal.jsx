import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  MapPin, 
  QrCode, 
  Banknote, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Clock, 
  Phone, 
  Navigation, 
  Scale 
} from 'lucide-react';
import { raiseFreightRequest } from '../services/api';

export default function FreightBookingModal({ 
  isOpen, 
  onClose, 
  vehicle, 
  currentLocation, 
  selectedMandi, 
  currentUser, 
  onFreightBooked 
}) {
  if (!isOpen || !vehicle) return null;

  const [cropType, setCropType] = useState('Arecanut & Coconuts');
  const [weightQuintals, setWeightQuintals] = useState(8);
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [deliveryWindow, setDeliveryWindow] = useState('Morning Mandi Auction (06:00 AM - 09:00 AM)');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'cash_on_pickup'
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedSlip, setConfirmedSlip] = useState(null);

  const ratePerQuintal = vehicle.ratePerQuintal || 45;
  const totalFreight = Math.round(weightQuintals * ratePerQuintal);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!weightQuintals || weightQuintals <= 0) {
      alert('Please enter a valid weight in Quintals.');
      return;
    }

    setIsProcessing(true);

    const transporterUpi = vehicle.upiId || 'transporter@upi';

    const payload = {
      farmerName: currentUser?.name || 'Ramesh Patel',
      farmerPhone: currentUser?.phone || '9876543210',
      cropType,
      weightQuintals: parseFloat(weightQuintals),
      pickupLocation: currentLocation || 'Farm Yard, Karnataka',
      targetMandi: selectedMandi,
      deliverySchedule: `${deliveryDate} • ${deliveryWindow}`,
      assignedVehicle: {
        vehicleRegNo: vehicle.vehicleRegNo,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
        vehicleName: vehicle.vehicleName,
        operatorName: vehicle.operatorName,
        upiId: transporterUpi
      },
      paymentMethod,
      totalFreight,
      transporterUpiId: transporterUpi,
      status: 'Pending Transporter Acceptance',
      paymentStatus: paymentMethod === 'upi' ? 'PAID via UPI' : 'PENDING (Cash on Pickup)',
      handlingNotes: `Booked on ${vehicle.vehicleName} (${vehicle.vehicleRegNo}) • Transporter UPI: ${transporterUpi}`
    };

    try {
      const created = await raiseFreightRequest(payload);
      setIsProcessing(false);
      setConfirmedSlip({
        ...created,
        waybillId: 'WB-KA-' + Math.floor(10000 + Math.random() * 90000),
        totalFreight,
        paymentMethod,
        paymentStatus: paymentMethod === 'upi' ? `PAID via UPI (${transporterUpi})` : 'PENDING (Cash on Pickup)'
      });

      if (onFreightBooked) onFreightBooked(created);
    } catch (err) {
      alert('Error booking freight: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {confirmedSlip ? 'Freight Booking Confirmed!' : 'Book Freight Carrier'}
              </h3>
              <p className="text-xs text-emerald-200">
                {vehicle.vehicleName} • <span className="font-mono">{vehicle.vehicleRegNo}</span>
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
          {!confirmedSlip ? (
            /* Booking Form */
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Pickup & Destination Summary */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                    Farm Freight Route
                  </span>
                  <span className="text-[11px] bg-emerald-200 text-emerald-950 font-bold px-2 py-0.5 rounded">
                    ₹{ratePerQuintal} / Quintal
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Pickup (Current Location): <strong className="text-emerald-950">{currentLocation}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>Destination Market: <strong className="text-slate-900">{selectedMandi}</strong></span>
                  </div>
                </div>
              </div>

              {/* Crop & Load Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Crop / Commodity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Arecanut & Coconuts">Arecanut & Coconuts</option>
                    <option value="Tender Coconut">Tender Coconut</option>
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Vegetables & Tomatoes">Vegetables & Tomatoes</option>
                    <option value="Silk Cocoons">Silk Cocoons</option>
                    <option value="Coffee & Spices">Coffee & Spices</option>
                    <option value="Paddy / Rice">Paddy / Rice</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Load Quantity (Quintals) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Scale className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max={vehicle.availableCapacityQuintals || 50}
                      required
                      value={weightQuintals}
                      onChange={(e) => setWeightQuintals(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Max: {vehicle.availableCapacityQuintals} Qtl space left
                  </span>
                </div>
              </div>

              {/* Delivery Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mandi Window</label>
                  <select
                    value={deliveryWindow}
                    onChange={(e) => setDeliveryWindow(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Morning Mandi Auction (06:00 AM - 09:00 AM)">Morning Auction (6 - 9 AM)</option>
                    <option value="Afternoon Consignment (01:00 PM - 04:00 PM)">Afternoon (1 - 4 PM)</option>
                    <option value="Evening Wholesale (05:00 PM - 08:00 PM)">Evening (5 - 8 PM)</option>
                  </select>
                </div>
              </div>

              {/* PAYMENT OPTIONS: UPI vs CASH ON PICKUP */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-semibold text-slate-700 mb-2">
                  Choose Freight Payment Method <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1: UPI */}
                  <label
                    className={`flex items-start p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-xl bg-emerald-600 text-white mr-2.5 flex-shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">UPI (Instant)</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Pay via UPI QR / GPay / PhonePe
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Cash on Pickup */}
                  <label
                    className={`flex items-start p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'cash_on_pickup'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_pickup"
                      checked={paymentMethod === 'cash_on_pickup'}
                      onChange={() => setPaymentMethod('cash_on_pickup')}
                      className="sr-only"
                    />
                    <div className="p-2 rounded-xl bg-amber-600 text-white mr-2.5 flex-shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Cash on Pickup</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Pay driver when goods are loaded
                      </div>
                    </div>
                  </label>
                </div>

                {/* UPI QR Display Simulation */}
                {paymentMethod === 'upi' ? (
                  <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-center space-x-3 text-slate-700">
                    <div className="w-16 h-16 bg-white border border-emerald-300 rounded-lg p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <QrCode className="w-12 h-12 text-emerald-950" />
                    </div>
                    <div className="text-[11px] space-y-1 flex-1">
                      <div className="font-bold text-emerald-900 flex items-center justify-between">
                        <span>Scan & Pay ₹{totalFreight} via UPI</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-950 px-1.5 py-0.2 rounded font-bold">Direct Settlement</span>
                      </div>
                      <div className="text-slate-600 flex items-center space-x-1.5 flex-wrap">
                        <span>Transporter UPI ID:</span>
                        <span className="font-mono font-bold text-emerald-950 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                          {vehicle.upiId || 'transporter@upi'}
                        </span>
                      </div>
                      <div className="text-emerald-700 font-semibold flex items-center text-[10px]">
                        <ShieldCheck className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span>Direct credit to transporter • Transporter receives & accepts your booking</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center space-x-2">
                    <Banknote className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      Pay <strong>₹{totalFreight} in Cash</strong> directly to driver <strong>{vehicle.driverName}</strong> upon arrival at your farm.
                    </span>
                  </div>
                )}
              </div>

              {/* Total & Submit */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="font-semibold text-slate-600">Total Freight Charges:</span>
                  <span className="font-black text-xl text-emerald-800">₹{totalFreight}</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <span>Confirming Freight Booking...</span>
                  ) : paymentMethod === 'upi' ? (
                    <span>Pay ₹{totalFreight} & Dispatch Vehicle</span>
                  ) : (
                    <span>Book (Pay ₹{totalFreight} Cash on Pickup)</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Digital Freight Consignment Slip / Waybill */
            <div className="space-y-4">
              <div className="bg-emerald-50 border-2 border-dashed border-emerald-400 rounded-2xl p-4 text-center space-y-1.5">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-emerald-950">Freight Booking Confirmed!</h4>
                <p className="text-xs text-emerald-700">
                  Vehicle has been dispatched to your farm pickup location.
                </p>
              </div>

              {/* Waybill Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Waybill Ref No.</span>
                    <span className="font-mono font-bold text-sm text-emerald-700">{confirmedSlip.waybillId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Payment Status</span>
                    <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      confirmedSlip.paymentMethod === 'upi' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {confirmedSlip.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Crop Consignment:</span>
                    <span className="font-bold text-slate-800">{confirmedSlip.cropType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Weight:</span>
                    <span className="font-bold text-slate-800">{confirmedSlip.weightQuintals} Quintals</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Carrier Vehicle:</span>
                    <span className="font-semibold text-slate-800">{vehicle.vehicleName} ({vehicle.vehicleRegNo})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Driver:</span>
                    <span className="font-semibold text-slate-800">{vehicle.driverName} (+91 {vehicle.driverPhone})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Farm Pickup Location:</span>
                    <span className="font-bold text-slate-800">{confirmedSlip.pickupLocation}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Destination Mandi:</span>
                    <span className="font-bold text-emerald-800">{confirmedSlip.targetMandi}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-600">Total Freight:</span>
                  <span className="font-extrabold text-base text-slate-900">₹{confirmedSlip.totalFreight}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors text-center"
                >
                  Done (View Active Shipments)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
