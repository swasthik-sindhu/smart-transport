// Rural Link Frontend API Service
// Connects frontend to Express backend at /api with transparent offline/localStorage fallback

const API_BASE = '/api';

export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend not healthy');
    return await res.json();
  } catch (err) {
    console.warn('Backend offline, running in client mode', err);
    return null;
  }
}

// 1. Auth: Register User
export async function apiRegister(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    const saved = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');
    saved.push(data.user);
    localStorage.setItem('smart_rural_users', JSON.stringify(saved));

    return data.user;
  } catch (err) {
    console.warn('Backend API unavailable, using local persistence:', err.message);
    const saved = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');
    const exists = saved.some(
      u => u.name.toLowerCase() === userData.name.toLowerCase() || u.phone === userData.phone
    );
    if (exists) throw new Error('User with this Name or Phone already exists.');

    const localUser = {
      ...userData,
      id: 'USR-' + Date.now(),
      registeredAt: new Date().toISOString()
    };
    saved.push(localUser);
    localStorage.setItem('smart_rural_users', JSON.stringify(saved));
    return localUser;
  }
}

// 2. Auth: Login User
export async function apiLogin(name, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data.user;
  } catch (err) {
    console.warn('Backend login fallback to localStorage:', err.message);
    const saved = JSON.parse(localStorage.getItem('smart_rural_users') || '[]');
    const matched = saved.find(
      u => u.name.toLowerCase() === name.trim().toLowerCase() ||
           u.phone === name.trim() ||
           u.email.toLowerCase() === name.trim().toLowerCase()
    );

    if (!matched) throw new Error('No registered account found with this Name.');
    if (matched.password !== password) throw new Error('Incorrect password. Please try again.');
    return matched;
  }
}

// 3. Freight: Get Available Freight Vehicles (from transport dashboard / backend)
export async function fetchFreightVehicles(location = '', destination = '') {
  try {
    const query = new URLSearchParams();
    if (location) query.append('location', location);
    if (destination) query.append('destination', destination);

    const res = await fetch(`${API_BASE}/transport/vehicles?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transport vehicles');
    return await res.json();
  } catch (err) {
    console.warn('Backend vehicle fetch failed, using mock fleet', err);
    return [
      {
        id: 'VEH-01',
        operatorName: 'Balaji Rural Cargo',
        driverName: 'Manjunath Gowda',
        driverPhone: '9844012399',
        vehicleName: 'Tata Ace Gold (Chota Hathi)',
        vehicleRegNo: 'KA-19-MH-8842',
        vehicleType: 'Mini Truck (1.5 Ton)',
        baseLocation: 'Kukke Subrahmanya',
        destinationMarket: 'Dharmasthala / Mangalore APMC',
        totalCapacityQuintals: 15,
        availableCapacityQuintals: 7,
        ratePerQuintal: 45,
        upiId: 'balajitransport@upi',
        departureSchedule: 'Today, 04:30 PM',
        rating: 4.8
      },
      {
        id: 'VEH-02',
        operatorName: 'Netravati Krishi Logistics',
        driverName: 'Shekar Poojary',
        driverPhone: '9880098765',
        vehicleName: 'Mahindra Bolero Maxi Truck Plus',
        vehicleRegNo: 'KA-21-B-3312',
        vehicleType: 'Pickup Truck (2.0 Ton)',
        baseLocation: 'Dharmasthala / Ujire',
        destinationMarket: 'Mangalore Baikampady APMC',
        totalCapacityQuintals: 20,
        availableCapacityQuintals: 12,
        ratePerQuintal: 40,
        upiId: 'netravati.cargo@okaxis',
        departureSchedule: 'Tonight, 08:00 PM (Night Mandi Express)',
        rating: 4.9
      },
      {
        id: 'VEH-03',
        operatorName: 'Cauvery Grama Vahini',
        driverName: 'Basavarajappa',
        driverPhone: '9741001122',
        vehicleName: 'Swaraj 855 Tractor Trolley',
        vehicleRegNo: 'KA-11-TR-9040',
        vehicleType: 'Heavy Agricultural Trolley (4.0 Ton)',
        baseLocation: 'Maddur / Mandya',
        destinationMarket: 'Mandya APMC Sugar & Jaggery Market',
        totalCapacityQuintals: 40,
        availableCapacityQuintals: 22,
        ratePerQuintal: 30,
        upiId: 'basava.tractor@upi',
        departureSchedule: 'Tomorrow, 06:00 AM (Early Auction)',
        rating: 4.7
      }
    ];
  }
}

// 4. Freight: Raise Produce Freight Request
export async function raiseFreightRequest(requestData) {
  try {
    const res = await fetch(`${API_BASE}/farmer/freight-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to raise request');

    // Sync to local storage
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    saved.unshift(data.freightRequest);
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(saved));

    return data.freightRequest;
  } catch (err) {
    console.warn('Backend request fallback to local storage:', err.message);
    const localReq = {
      ...requestData,
      id: 'FR-KA-' + Math.floor(1000 + Math.random() * 9000),
      status: 'In Transit',
      assignedVehicle: {
        vehicleRegNo: 'KA-19-MH-8842',
        driverName: 'Manjunath Gowda',
        driverPhone: '9844012399',
        vehicleName: 'Tata Ace Gold'
      },
      liveTelemetry: {
        currentLocationName: `${requestData.pickupLocation || 'Farm Yard'} Link Road`,
        lat: 12.8797,
        lng: 75.0344,
        speedKm: 42,
        direction: `Heading towards ${requestData.targetMandi} (Compass: 315° NW)`,
        distanceRemainingKm: 34,
        etaMinutes: 45,
        milestones: [
          { title: 'Produce Picked up at Farm', status: 'completed', time: 'Just now' },
          { title: 'Dispatched on Highway Corridor', status: 'active', time: 'In Progress' },
          { title: `Approaching ${requestData.targetMandi} Gate`, status: 'pending', time: 'Upcoming' },
          { title: 'Weighbridge & Market Auction Delivery', status: 'pending', time: 'Scheduled' }
        ]
      },
      postedAt: new Date().toISOString()
    };

    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    saved.unshift(localReq);
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(saved));
    return localReq;
  }
}

// 5. Freight: Get All Raised Requests
export async function fetchFarmerFreightRequests() {
  try {
    const res = await fetch(`${API_BASE}/farmer/freight-requests`);
    if (!res.ok) throw new Error('Failed to fetch requests');
    return await res.json();
  } catch (err) {
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    return saved;
  }
}

// 5b. Freight: Cancel Freight Request (Restores fleet capacity)
export async function apiCancelFreightRequest(requestId) {
  try {
    const res = await fetch(`${API_BASE}/farmer/freight-requests/${requestId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel freight request');

    // Update local storage
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    const updated = saved.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'CANCELLED', paymentStatus: 'CANCELLED (Refund Processed)' };
      }
      return r;
    });
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));

    return data.freightRequest;
  } catch (err) {
    console.warn('Backend cancel failed, updating local storage:', err.message);
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    let cancelledReq = null;
    const updated = saved.map(r => {
      if (r.id === requestId) {
        cancelledReq = { ...r, status: 'CANCELLED', paymentStatus: 'CANCELLED (Refund Processed)' };
        return cancelledReq;
      }
      return r;
    });
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));
    return cancelledReq || { id: requestId, status: 'CANCELLED', paymentStatus: 'CANCELLED (Refund Processed)' };
  }
}

// 6. Bookings: Create Passenger Ticket
export async function apiCreateBooking(bookingData) {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking failed');

    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    saved.unshift(data.booking);
    localStorage.setItem('rural_link_passenger_bookings', JSON.stringify(saved));

    return data.booking;
  } catch (err) {
    const localBooking = {
      ...bookingData,
      bookingId: 'RL-KA-' + Math.floor(10000 + Math.random() * 90000),
      bookedAt: new Date().toLocaleString(),
      paymentStatus: bookingData.paymentMethod === 'online' ? 'PAID (UPI Confirmed)' : 'PENDING (Cash on Boarding)'
    };
    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    saved.unshift(localBooking);
    localStorage.setItem('rural_link_passenger_bookings', JSON.stringify(saved));
    return localBooking;
  }
}

// 6b. Bookings: Fetch Passenger Bookings (from SQLite with local storage fallback)
export async function fetchPassengerBookings(passengerPhone = '') {
  try {
    const res = await fetch(`${API_BASE}/bookings`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const all = await res.json();
    if (passengerPhone) {
      const pClean = passengerPhone.toString().trim().toLowerCase();
      const userBookings = all.filter(b => 
        (b.passengerPhone && b.passengerPhone.toString().trim() === pClean) ||
        (b.passengerName && b.passengerName.trim().toLowerCase() === pClean)
      );
      return userBookings.length > 0 ? userBookings : all;
    }
    return all;
  } catch (err) {
    console.warn('Backend bookings fetch failed, falling back to local storage', err);
    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    if (passengerPhone) {
      const pClean = passengerPhone.toString().trim().toLowerCase();
      const userBookings = saved.filter(b => 
        (b.passengerPhone && b.passengerPhone.toString().trim() === pClean) ||
        (b.passengerName && b.passengerName.trim().toLowerCase() === pClean)
      );
      return userBookings.length > 0 ? userBookings : saved;
    }
    return saved;
  }
}

// 6c. Bookings: Cancel Passenger Ticket (Restores seat to operator)
export async function apiCancelBooking(bookingId) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');

    // Update local storage
    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    const updated = saved.map(b => {
      if (b.bookingId === bookingId || b.id === bookingId) {
        return { ...b, paymentStatus: 'CANCELLED (Refund Processed)' };
      }
      return b;
    });
    localStorage.setItem('rural_link_passenger_bookings', JSON.stringify(updated));

    return data.booking;
  } catch (err) {
    console.warn('Backend cancel failed, updating local storage:', err.message);
    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    let cancelledBooking = null;
    const updated = saved.map(b => {
      if (b.bookingId === bookingId || b.id === bookingId) {
        cancelledBooking = { ...b, paymentStatus: 'CANCELLED (Refund Processed)' };
        return cancelledBooking;
      }
      return b;
    });
    localStorage.setItem('rural_link_passenger_bookings', JSON.stringify(updated));
    return cancelledBooking || { bookingId, paymentStatus: 'CANCELLED (Refund Processed)' };
  }
}

// 7. Travels: Create Route Task & Broadcast Trip
export async function createTravelTrip(tripData) {
  try {
    const res = await fetch(`${API_BASE}/travels/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create travel trip');

    // Save to local storage cache as well
    const saved = JSON.parse(localStorage.getItem('rural_link_travel_trips') || '[]');
    saved.unshift(data.trip);
    localStorage.setItem('rural_link_travel_trips', JSON.stringify(saved));

    return data.trip;
  } catch (err) {
    console.warn('Backend unavailable, saving trip locally:', err.message);
    const localTrip = {
      ...tripData,
      id: 'TRIP-KA-' + Math.floor(100 + Math.random() * 900),
      fare: tripData.fare || 65,
      systemDeclaredFare: tripData.fare || 65,
      availableSeats: tripData.totalSeats || 18,
      status: 'Ready to Depart',
      liveLocation: {
        lat: tripData.initialLat || 12.6631,
        lng: tripData.initialLng || 75.6158,
        speedKm: 0,
        currentStop: `${tripData.source} Terminal Bay #1`,
        direction: `Heading towards ${tripData.destination}`,
        status: 'Ready to Depart',
        lastUpdated: new Date().toLocaleTimeString()
      },
      createdAt: new Date().toISOString()
    };

    const saved = JSON.parse(localStorage.getItem('rural_link_travel_trips') || '[]');
    saved.unshift(localTrip);
    localStorage.setItem('rural_link_travel_trips', JSON.stringify(saved));
    return localTrip;
  }
}

// 8. Travels: Get Active Trips (Shared to Passenger Dashboard)
export async function fetchTravelTrips(source = '', destination = '', operatorId = '') {
  try {
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (destination) params.append('destination', destination);
    if (operatorId) params.append('operatorId', operatorId);

    const res = await fetch(`${API_BASE}/travels/trips?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch travel trips');
    return await res.json();
  } catch (err) {
    console.warn('Fetching trips locally fallback:', err.message);
    const saved = JSON.parse(localStorage.getItem('rural_link_travel_trips') || '[]');
    return saved;
  }
}

// 9. Travels: Update Live Location Broadcast
export async function updateTripLiveLocation(tripId, liveData) {
  try {
    const res = await fetch(`${API_BASE}/travels/trips/${tripId}/live-location`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(liveData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update live location');
    return data.trip;
  } catch (err) {
    console.warn('Offline update for trip live location:', err.message);
    return null;
  }
}

// 10. Travels: Get Bookings for a Trip
export async function fetchTripBookings(tripId) {
  try {
    const res = await fetch(`${API_BASE}/travels/trips/${tripId}/bookings`);
    if (!res.ok) throw new Error('Failed to fetch trip bookings');
    return await res.json();
  } catch (err) {
    const saved = JSON.parse(localStorage.getItem('rural_link_passenger_bookings') || '[]');
    return saved.filter(b => b.busId === tripId);
  }
}

// 11. Transporter: Create / Publish Route Task & Freight Vehicle
export async function createTransportTask(taskData) {
  try {
    const res = await fetch(`${API_BASE}/transport/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create transport task');

    // LocalStorage fallback cache
    const saved = JSON.parse(localStorage.getItem('rural_link_transport_tasks') || '[]');
    const filtered = saved.filter(t => t.id !== data.vehicle.id && t.vehicleRegNo !== data.vehicle.vehicleRegNo);
    filtered.unshift(data.vehicle);
    localStorage.setItem('rural_link_transport_tasks', JSON.stringify(filtered));

    return data.vehicle;
  } catch (err) {
    console.warn('Backend unavailable, saving transport task locally:', err.message);
    const localTask = {
      ...taskData,
      id: 'VEH-L-' + Math.floor(1000 + Math.random() * 9000),
      rating: 4.9,
      availableCapacityQuintals: taskData.availableCapacityQuintals || taskData.totalCapacityQuintals || 20,
      liveLocation: {
        currentLocationName: `${taskData.baseLocation} Hub Yard`,
        lat: 12.6631,
        lng: 75.6158,
        speedKm: 0,
        direction: `Heading towards ${taskData.destinationMarket} via ${taskData.viaRoute || 'State Highway'}`,
        checkpoint: 'Docked at Starting Point',
        status: 'Accepting Cargo Bookings',
        lastUpdated: new Date().toLocaleTimeString()
      }
    };
    const saved = JSON.parse(localStorage.getItem('rural_link_transport_tasks') || '[]');
    saved.unshift(localTask);
    localStorage.setItem('rural_link_transport_tasks', JSON.stringify(saved));
    return localTask;
  }
}

// 12. Transporter: Get My Active Tasks
export async function fetchTransportTasks(operatorId = '', vehicleRegNo = '') {
  try {
    const params = new URLSearchParams();
    if (operatorId) params.append('operatorId', operatorId);
    if (vehicleRegNo) params.append('vehicleRegNo', vehicleRegNo);

    const res = await fetch(`${API_BASE}/transport/my-tasks?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transport tasks');
    return await res.json();
  } catch (err) {
    const saved = JSON.parse(localStorage.getItem('rural_link_transport_tasks') || '[]');
    return saved;
  }
}

// 13. Transporter: Update Live Telemetry
export async function updateTransportTelemetry(taskId, telemetryData) {
  try {
    const res = await fetch(`${API_BASE}/transport/tasks/${taskId}/telemetry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetryData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update telemetry');
    return data.vehicle;
  } catch (err) {
    console.warn('Backend unavailable, updating local telemetry:', err.message);
    return null;
  }
}

// 14. Transporter: Get Incoming Requests for this Transporter
export async function fetchTransporterRequests(vehicleRegNo = '', operatorName = '', baseLocation = '') {
  try {
    const params = new URLSearchParams();
    if (vehicleRegNo) params.append('vehicleRegNo', vehicleRegNo);
    if (operatorName) params.append('operatorName', operatorName);
    if (baseLocation) params.append('baseLocation', baseLocation);

    const res = await fetch(`${API_BASE}/transport/incoming-requests?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch incoming requests');
    return await res.json();
  } catch (err) {
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    return saved;
  }
}

// 15. Transporter: Accept Farmer Freight Request (Updates Available Capacity)
export async function acceptFreightRequest(requestId, vehicleRegNo = '') {
  try {
    const res = await fetch(`${API_BASE}/transport/requests/${requestId}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleRegNo })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to accept request');

    // Update local storage
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    const updated = saved.map(r => r.id === requestId ? { ...r, status: 'Accepted (Scheduled for Pickup)' } : r);
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));

    return data.freightRequest;
  } catch (err) {
    console.warn('Backend unavailable, updating local request status:', err.message);
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    let accepted = null;
    const updated = saved.map(r => {
      if (r.id === requestId) {
        accepted = { ...r, status: 'Accepted (Scheduled for Pickup)' };
        return accepted;
      }
      return r;
    });
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));
    return accepted || { id: requestId, status: 'Accepted (Scheduled for Pickup)' };
  }
}

// 16. Transporter: Reject Farmer Freight Request
export async function rejectFreightRequest(requestId, reason = '') {
  try {
    const res = await fetch(`${API_BASE}/transport/requests/${requestId}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reject request');

    // Update local storage
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    const updated = saved.map(r => r.id === requestId ? { ...r, status: 'Rejected by Transporter', paymentStatus: 'CANCELLED (Refund Processed)' } : r);
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));

    return data.freightRequest;
  } catch (err) {
    console.warn('Backend unavailable, updating local rejection:', err.message);
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    let rejected = null;
    const updated = saved.map(r => {
      if (r.id === requestId) {
        rejected = { ...r, status: 'Rejected by Transporter', paymentStatus: 'CANCELLED (Refund Processed)' };
        return rejected;
      }
      return r;
    });
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));
    return rejected || { id: requestId, status: 'Rejected by Transporter' };
  }
}

// 17. Transporter: Update Status (In Transit / Delivered)
export async function updateFreightRequestStatus(requestId, status, checkpoint = '') {
  try {
    const res = await fetch(`${API_BASE}/transport/requests/${requestId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, checkpoint })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return data.freightRequest;
  } catch (err) {
    console.warn('Backend unavailable, local status update:', err.message);
    const saved = JSON.parse(localStorage.getItem('rural_link_farmer_requests') || '[]');
    const updated = saved.map(r => r.id === requestId ? { ...r, status } : r);
    localStorage.setItem('rural_link_farmer_requests', JSON.stringify(updated));
    return { id: requestId, status };
  }
}

