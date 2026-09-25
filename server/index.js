import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { initDb, dbRun, dbGet, dbAll } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------------- MODEL MAPPERS ---------------------- //

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    phone: row.phone,
    email: row.email,
    password: row.password,
    operatorType: row.operator_type,
    vehicleName: row.vehicle_name,
    vehicleRegNo: row.vehicle_reg_no,
    seatingCapacity: row.seating_capacity,
    loadingCapacity: row.loading_capacity,
    upiId: row.upi_id,
    location: row.location,
    registeredAt: row.created_at
  };
}

function mapVehicle(row) {
  if (!row) return null;
  let liveLocation = null;
  try {
    liveLocation = typeof row.live_location === 'string' ? JSON.parse(row.live_location) : row.live_location;
  } catch (e) {
    liveLocation = row.live_location;
  }
  let allowedGoods = [];
  try {
    if (row.allowed_goods) {
      allowedGoods = typeof row.allowed_goods === 'string' && row.allowed_goods.trim().startsWith('[')
        ? JSON.parse(row.allowed_goods)
        : row.allowed_goods.split(',').map(s => s.trim());
    } else {
      allowedGoods = ['Arecanut & Coconuts', 'Tomatoes & Vegetables', 'Sugarcane', 'Paddy / Rice'];
    }
  } catch (e) {
    allowedGoods = ['Arecanut & Coconuts', 'Tomatoes & Vegetables', 'Sugarcane', 'Paddy / Rice'];
  }

  return {
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    vehicleName: row.vehicle_name,
    vehicleRegNo: row.vehicle_reg_no,
    vehicleType: row.vehicle_type,
    baseLocation: row.base_location,
    destinationMarket: row.destination_market,
    viaRoute: row.via_route || 'State Highway Freight Corridor',
    totalCapacityQuintals: row.total_capacity_quintals,
    availableCapacityQuintals: row.available_capacity_quintals,
    ratePerQuintal: row.rate_per_quintal,
    allowedGoods,
    isShared: row.is_shared === undefined || row.is_shared === null ? true : Boolean(row.is_shared),
    sharedPricingRule: row.shared_pricing_rule || 'Proportional Load & Distance Split',
    upiId: row.upi_id,
    departureSchedule: row.departure_schedule,
    liveLocation,
    rating: row.rating || 4.8
  };
}

function mapRequest(row) {
  if (!row) return null;
  let assignedVehicle = null;
  let liveTelemetry = null;
  try {
    assignedVehicle = typeof row.assigned_vehicle === 'string' ? JSON.parse(row.assigned_vehicle) : row.assigned_vehicle;
  } catch (e) {
    assignedVehicle = row.assigned_vehicle;
  }
  try {
    liveTelemetry = typeof row.live_telemetry === 'string' ? JSON.parse(row.live_telemetry) : row.live_telemetry;
  } catch (e) {
    liveTelemetry = row.live_telemetry;
  }
  return {
    id: row.id,
    farmerName: row.farmer_name,
    farmerPhone: row.farmer_phone,
    cropType: row.crop_type,
    weightQuintals: row.weight_quintals,
    pickupLocation: row.pickup_location,
    targetMandi: row.target_mandi,
    deliverySchedule: row.delivery_schedule,
    assignedVehicle,
    status: row.status,
    paymentMethod: row.payment_method,
    totalFreight: row.total_freight,
    paymentStatus: row.payment_status,
    transporterUpiId: row.transporter_upi_id || (assignedVehicle && assignedVehicle.upiId) || null,
    liveTelemetry,
    handlingNotes: row.handling_notes,
    postedAt: row.posted_at
  };
}

function mapBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    bookingId: row.booking_id,
    busId: row.bus_id,
    busName: row.bus_name,
    vehicleRegNo: row.vehicle_reg_no,
    source: row.source,
    destination: row.destination,
    departureTime: row.departure_time,
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone,
    seatCount: row.seat_count,
    totalFare: row.total_fare,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    bookedAt: row.booked_at
  };
}

function mapTrip(row) {
  if (!row) return null;
  let liveLocation = null;
  try {
    liveLocation = typeof row.live_location === 'string' ? JSON.parse(row.live_location) : row.live_location;
  } catch (e) {
    liveLocation = row.live_location;
  }
  return {
    id: row.id,
    operatorId: row.operator_id,
    operatorName: row.operator_name,
    operatorPhone: row.operator_phone,
    busName: row.bus_name,
    vehicleRegNo: row.vehicle_reg_no,
    busType: row.bus_type,
    source: row.source,
    destination: row.destination,
    viaRoute: row.via_route,
    departureTime: row.departure_time,
    departureDate: row.departure_date,
    totalSeats: row.total_seats,
    availableSeats: row.available_seats,
    fare: row.fare,
    systemDeclaredFare: row.system_declared_fare,
    distanceKm: row.distance_km,
    status: row.status,
    liveLocation,
    createdAt: row.created_at
  };
}

// System-declared official Karnataka Rural Stage Carriage Tariff
function calculateOfficialTariff(distanceKm, busType = 'Standard') {
  const ratePerKm = (busType && (busType.includes('Cruiser') || busType.includes('Express'))) ? 1.40 : 1.25;
  const rawFare = Math.round(distanceKm * ratePerKm);
  return Math.max(30, Math.round(rawFare / 5) * 5); // locked to nearest ₹5, minimum ₹30
}

// ---------------------- API ROUTES ---------------------- //

// 1. Health check with database telemetry
app.get('/api/health', async (req, res) => {
  try {
    await dbGet('SELECT 1 as ok');
    const userCount = await dbGet('SELECT COUNT(*) as c FROM users');
    const vehCount = await dbGet('SELECT COUNT(*) as c FROM freight_vehicles');
    const reqCount = await dbGet('SELECT COUNT(*) as c FROM freight_requests');
    const bookCount = await dbGet('SELECT COUNT(*) as c FROM bookings');
    const tripCount = await dbGet('SELECT COUNT(*) as c FROM travel_trips');

    res.json({
      status: 'online',
      system: 'Rural Link Backend API',
      database: 'SQLite3 (server/data/rurallink.db)',
      state: 'Karnataka State Rural Transport & Freight System',
      stats: {
        registeredUsers: userCount?.c || 0,
        freightVehicles: vehCount?.c || 0,
        activeConsignments: reqCount?.c || 0,
        passengerBookings: bookCount?.c || 0,
        activeTravelTrips: tripCount?.c || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'degraded', database: 'offline', error: err.message });
  }
});

// 2. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      email, 
      password, 
      role, 
      operatorType, 
      vehicleName, 
      vehicleRegNo, 
      seatingCapacity, 
      loadingCapacity, 
      upiId 
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, Phone, and Password are required.' });
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    const existingUser = await dbGet(
      'SELECT id FROM users WHERE LOWER(name) = LOWER(?) OR phone = ?',
      [cleanName, cleanPhone]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User with this Name or Phone already exists.' });
    }

    const userId = 'USR-' + Date.now();
    const nowIso = new Date().toISOString();

    await dbRun(`
      INSERT INTO users (
        id, role, name, phone, email, password, operator_type,
        vehicle_name, vehicle_reg_no, seating_capacity, loading_capacity,
        upi_id, location, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      role || 'farmer',
      cleanName,
      cleanPhone,
      (email || '').trim().toLowerCase(),
      password,
      role === 'operator' ? operatorType : null,
      role === 'operator' ? vehicleName : null,
      role === 'operator' ? vehicleRegNo : null,
      role === 'operator' && operatorType === 'travels' ? parseInt(seatingCapacity, 10) || null : null,
      role === 'operator' && operatorType === 'transport' ? loadingCapacity : null,
      role === 'operator' ? upiId : null,
      'Kukke Subrahmanya, Dakshina Kannada',
      nowIso
    ]);

    // If transport operator, automatically register their freight vehicle to the live fleet
    if (role === 'operator' && operatorType === 'transport') {
      const vehId = 'VEH-' + Math.floor(1000 + Math.random() * 9000);
      await dbRun(`
        INSERT INTO freight_vehicles (
          id, operator_name, driver_name, driver_phone, vehicle_name,
          vehicle_reg_no, vehicle_type, base_location, destination_market,
          total_capacity_quintals, available_capacity_quintals, rate_per_quintal,
          upi_id, departure_schedule, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vehId,
        cleanName,
        cleanName,
        cleanPhone,
        vehicleName || 'Tata Ace Gold (Chota Hathi)',
        vehicleRegNo || 'KA-19-MH-9999',
        'Freight Carrier (' + (loadingCapacity || '1.5 Ton') + ')',
        'Kukke Subrahmanya',
        'Mangalore Baikampady APMC',
        18,
        18,
        45,
        upiId || 'operator@upi',
        'Daily 05:00 PM',
        5.0
      ]);
    }

    const createdRow = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
    res.status(201).json({ message: 'Registration successful', user: mapUser(createdRow) });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Server error during registration: ' + err.message });
  }
});

// 3. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ error: 'Please enter Name and Password.' });
    }

    const cleanInput = name.trim();
    const userRow = await dbGet(
      'SELECT * FROM users WHERE LOWER(name) = LOWER(?) OR phone = ? OR LOWER(email) = LOWER(?)',
      [cleanInput, cleanInput, cleanInput]
    );

    if (!userRow) {
      return res.status(404).json({ error: 'No registered account found with this Name or Phone.' });
    }

    if (userRow.password !== password) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    res.json({ message: 'Login successful', user: mapUser(userRow) });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

// 4. Update Profile
app.put('/api/auth/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, email, location, vehicleName, vehicleRegNo, upiId } = req.body;

    const existing = await dbGet('SELECT * FROM users WHERE id = ? OR phone = ?', [userId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await dbRun(`
      UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        location = COALESCE(?, location),
        vehicle_name = COALESCE(?, vehicle_name),
        vehicle_reg_no = COALESCE(?, vehicle_reg_no),
        upi_id = COALESCE(?, upi_id)
      WHERE id = ? OR phone = ?
    `, [
      name || null,
      phone || null,
      email || null,
      location || null,
      vehicleName || null,
      vehicleRegNo || null,
      upiId || null,
      userId,
      userId
    ]);

    const updated = await dbGet('SELECT * FROM users WHERE id = ? OR phone = ?', [userId, userId]);
    res.json({ message: 'Profile updated successfully', user: mapUser(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile: ' + err.message });
  }
});

// 5. Freight: Get Available Freight Vehicles (Transport Fleet from SQLite)
app.get('/api/transport/vehicles', async (req, res) => {
  try {
    const { location } = req.query;
    let rows;
    if (location) {
      const q = `%${location.toLowerCase().trim()}%`;
      rows = await dbAll(
        'SELECT * FROM freight_vehicles WHERE LOWER(base_location) LIKE ? OR LOWER(destination_market) LIKE ?',
        [q, q]
      );
      if (rows.length === 0) {
        rows = await dbAll('SELECT * FROM freight_vehicles');
      }
    } else {
      rows = await dbAll('SELECT * FROM freight_vehicles');
    }

    res.json(rows.map(mapVehicle));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch freight vehicles: ' + err.message });
  }
});

// 6. Freight: Raise Produce Freight Request (Stored in SQLite)
app.post('/api/farmer/freight-requests', async (req, res) => {
  try {
    const { 
      farmerName, 
      farmerPhone, 
      cropType, 
      weightQuintals, 
      pickupLocation, 
      targetMandi, 
      deliverySchedule, 
      assignedVehicle,
      paymentMethod,
      totalFreight,
      paymentStatus,
      handlingNotes 
    } = req.body;

    if (!cropType || !weightQuintals || !targetMandi) {
      return res.status(400).json({ error: 'Crop type, weight, and destination market are required.' });
    }

    const reqId = 'FR-KA-' + Math.floor(1000 + Math.random() * 9000);
    const weight = parseFloat(weightQuintals);
    const freightAmount = totalFreight ? parseFloat(totalFreight) : Math.round(weight * 42);
    const selectedPayMethod = paymentMethod || 'upi';
    const payStatus = paymentStatus || (selectedPayMethod === 'upi' ? 'PAID via UPI' : 'PENDING (Cash on Pickup)');

    const assignedVehicleObj = assignedVehicle || {
      vehicleRegNo: 'KA-19-MH-8842',
      driverName: 'Manjunath Gowda',
      driverPhone: '9844012399',
      vehicleName: 'Tata Ace Gold',
      upiId: 'balajitransport@upi'
    };

    const targetUpiId = req.body.transporterUpiId || assignedVehicleObj.upiId || 'transporter@upi';

    const telemetryObj = {
      currentLocationName: `${pickupLocation || 'Farm Yard'} Checkpost Corridor`,
      lat: 12.8797,
      lng: 75.0344,
      speedKm: 42,
      direction: `Heading towards ${targetMandi} via State Highway Link (Compass: 315° NW)`,
      distanceRemainingKm: 34,
      etaMinutes: 45,
      milestones: [
        { title: 'Produce Picked up at Farm', status: 'completed', time: 'Just now' },
        { title: 'Dispatched on Highway Corridor', status: 'active', time: 'In Progress' },
        { title: `Approaching ${targetMandi} Gate`, status: 'pending', time: 'Upcoming' },
        { title: 'Weighbridge & Market Auction Delivery', status: 'pending', time: 'Scheduled' }
      ]
    };

    const nowIso = new Date().toISOString();
    const initialStatus = req.body.status || 'Pending Acceptance';

    await dbRun(`
      INSERT INTO freight_requests (
        id, farmer_name, farmer_phone, crop_type, weight_quintals,
        pickup_location, target_mandi, delivery_schedule, assigned_vehicle,
        status, payment_method, total_freight, payment_status, transporter_upi_id,
        live_telemetry, handling_notes, posted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reqId,
      farmerName || 'Ramesh Patel',
      farmerPhone || '9876543210',
      cropType,
      weight,
      pickupLocation || 'Farm Yard, Karnataka',
      targetMandi,
      deliverySchedule || 'Tomorrow Morning Mandi Auction (06:00 AM)',
      JSON.stringify(assignedVehicleObj),
      initialStatus,
      selectedPayMethod,
      freightAmount,
      payStatus,
      targetUpiId,
      JSON.stringify(telemetryObj),
      handlingNotes || 'Standard agricultural harvest packaging',
      nowIso
    ]);

    // Note: Available capacity will be deducted as soon as the transporter accepts the load
    const createdRow = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [reqId]);
    res.status(201).json({
      message: 'Freight request raised successfully',
      freightRequest: mapRequest(createdRow)
    });
  } catch (err) {
    console.error('Error raising freight request:', err);
    res.status(500).json({ error: 'Server error raising freight request: ' + err.message });
  }
});

// 7. Freight: Get All Raised Requests (from SQLite)
app.get('/api/farmer/freight-requests', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM freight_requests ORDER BY posted_at DESC');
    res.json(rows.map(mapRequest));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch freight requests: ' + err.message });
  }
});

// 8. Freight: Live Goods Tracking & Direction Monitor
app.get('/api/farmer/goods-tracking/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const row = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [requestId]);
    if (!row) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }
    const found = mapRequest(row);
    res.json({
      requestId: found.id,
      cropType: found.cropType,
      weightQuintals: found.weightQuintals,
      targetMandi: found.targetMandi,
      status: found.status,
      assignedVehicle: found.assignedVehicle,
      liveTelemetry: found.liveTelemetry
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tracking: ' + err.message });
  }
});

// 8b. Freight: Cancel Freight Booking (Restores Vehicle Capacity in SQLite)
app.put('/api/farmer/freight-requests/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Freight booking not found' });
    }

    const currentReq = mapRequest(row);

    // If assigned to a vehicle, restore its available capacity
    if (currentReq.assignedVehicle && currentReq.assignedVehicle.vehicleRegNo) {
      const reg = currentReq.assignedVehicle.vehicleRegNo;
      const weight = currentReq.weightQuintals || 0;
      await dbRun(`
        UPDATE freight_vehicles 
        SET available_capacity_quintals = MIN(total_capacity_quintals, available_capacity_quintals + ?) 
        WHERE vehicle_reg_no = ?
      `, [weight, reg]);
    }

    // Mark as CANCELLED with refund note
    await dbRun(`
      UPDATE freight_requests 
      SET status = ?, payment_status = ? 
      WHERE id = ?
    `, ['CANCELLED', 'CANCELLED (Refund Processed)', id]);

    const updatedRow = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    res.json({ message: 'Freight booking cancelled successfully', freightRequest: mapRequest(updatedRow) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel freight request: ' + err.message });
  }
});

app.delete('/api/farmer/freight-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Freight request not found' });
    }

    const currentReq = mapRequest(row);
    if (currentReq.assignedVehicle && currentReq.assignedVehicle.vehicleRegNo) {
      const reg = currentReq.assignedVehicle.vehicleRegNo;
      const weight = currentReq.weightQuintals || 0;
      await dbRun(`
        UPDATE freight_vehicles 
        SET available_capacity_quintals = MIN(total_capacity_quintals, available_capacity_quintals + ?) 
        WHERE vehicle_reg_no = ?
      `, [weight, reg]);
    }

    await dbRun('DELETE FROM freight_requests WHERE id = ?', [id]);
    res.json({ message: 'Freight request deleted successfully', id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete freight request: ' + err.message });
  }
});

// ---------------------- TRANSPORTER DASHBOARD ROUTES ---------------------- //

// 8c. Transporter: Create / Publish Route Task & Freight Vehicle (Broadcast to Farmer Dashboard)
app.post('/api/transport/tasks', async (req, res) => {
  try {
    const {
      operatorId,
      operatorName,
      driverName,
      driverPhone,
      vehicleName,
      vehicleRegNo,
      vehicleType,
      baseLocation, // Starting Point
      destinationMarket, // Ending Point
      viaRoute, // Route he is going in
      totalCapacityQuintals,
      availableCapacityQuintals,
      ratePerQuintal,
      allowedGoods, // Suggested from farmer dashboard
      isShared, // Sharing enabled
      sharedPricingRule,
      upiId, // Transporter UPI ID
      departureSchedule,
      liveLocation
    } = req.body;

    if (!baseLocation || !destinationMarket || !vehicleRegNo) {
      return res.status(400).json({ error: 'Starting point, destination market, and vehicle registration number are required.' });
    }

    const cleanRegNo = vehicleRegNo.trim();
    const existing = await dbGet('SELECT * FROM freight_vehicles WHERE vehicle_reg_no = ? OR (operator_id = ? AND operator_id IS NOT NULL)', [cleanRegNo, operatorId || 'NONE']);

    const taskId = existing ? existing.id : ('VEH-' + Math.floor(1000 + Math.random() * 9000));
    const totalCap = parseFloat(totalCapacityQuintals) || 20;
    const availCap = availableCapacityQuintals !== undefined ? parseFloat(availableCapacityQuintals) : totalCap;
    const rate = parseFloat(ratePerQuintal) || 45;
    const allowedGoodsStr = Array.isArray(allowedGoods) ? JSON.stringify(allowedGoods) : (allowedGoods || '["Arecanut & Coconuts", "Tomatoes & Vegetables", "Sugarcane", "Paddy / Rice"]');
    const isSharedVal = isShared !== false ? 1 : 0;
    const liveLocStr = typeof liveLocation === 'object' ? JSON.stringify(liveLocation) : (liveLocation || JSON.stringify({
      currentLocationName: `${baseLocation} Hub Yard`,
      lat: 12.6631,
      lng: 75.6158,
      speedKm: 0,
      direction: `Heading towards ${destinationMarket} via ${viaRoute || 'State Highway'}`,
      checkpoint: 'Docked at Starting Point',
      status: 'Accepting Cargo Bookings'
    }));

    if (existing) {
      await dbRun(`
        UPDATE freight_vehicles SET
          operator_id = COALESCE(?, operator_id),
          operator_name = COALESCE(?, operator_name),
          driver_name = COALESCE(?, driver_name),
          driver_phone = COALESCE(?, driver_phone),
          vehicle_name = COALESCE(?, vehicle_name),
          vehicle_type = COALESCE(?, vehicle_type),
          base_location = ?,
          destination_market = ?,
          via_route = ?,
          total_capacity_quintals = ?,
          available_capacity_quintals = ?,
          rate_per_quintal = ?,
          allowed_goods = ?,
          is_shared = ?,
          shared_pricing_rule = ?,
          upi_id = ?,
          departure_schedule = ?,
          live_location = ?
        WHERE id = ?
      `, [
        operatorId || null,
        operatorName || null,
        driverName || null,
        driverPhone || null,
        vehicleName || null,
        vehicleType || null,
        baseLocation,
        destinationMarket,
        viaRoute || 'Direct State Highway Link',
        totalCap,
        availCap,
        rate,
        allowedGoodsStr,
        isSharedVal,
        sharedPricingRule || 'Distance & Load Shared Pro-Rata',
        upiId || 'transporter@upi',
        departureSchedule || 'Today, 05:00 PM',
        liveLocStr,
        taskId
      ]);
    } else {
      await dbRun(`
        INSERT INTO freight_vehicles (
          id, operator_id, operator_name, driver_name, driver_phone,
          vehicle_name, vehicle_reg_no, vehicle_type, base_location,
          destination_market, via_route, total_capacity_quintals,
          available_capacity_quintals, rate_per_quintal, allowed_goods,
          is_shared, shared_pricing_rule, upi_id, departure_schedule,
          live_location, rating
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        taskId,
        operatorId || null,
        operatorName || 'Transporter',
        driverName || operatorName || 'Driver',
        driverPhone || '9876543210',
        vehicleName || 'Cargo Truck',
        cleanRegNo,
        vehicleType || 'Medium Freight Carrier (3.5 Ton)',
        baseLocation,
        destinationMarket,
        viaRoute || 'Direct State Highway Link',
        totalCap,
        availCap,
        rate,
        allowedGoodsStr,
        isSharedVal,
        sharedPricingRule || 'Distance & Load Shared Pro-Rata',
        upiId || 'transporter@upi',
        departureSchedule || 'Today, 05:00 PM',
        liveLocStr,
        4.9
      ]);
    }

    const row = await dbGet('SELECT * FROM freight_vehicles WHERE id = ?', [taskId]);
    res.status(201).json({ message: 'Transport task published successfully', vehicle: mapVehicle(row) });
  } catch (err) {
    console.error('Error creating transport task:', err);
    res.status(500).json({ error: 'Failed to create transport task: ' + err.message });
  }
});

// 8d. Transporter: Get My Active Tasks / Vehicles
app.get('/api/transport/my-tasks', async (req, res) => {
  try {
    const { operatorId, vehicleRegNo } = req.query;
    let rows;
    if (operatorId && vehicleRegNo) {
      rows = await dbAll('SELECT * FROM freight_vehicles WHERE operator_id = ? OR vehicle_reg_no = ?', [operatorId, vehicleRegNo]);
    } else if (operatorId) {
      rows = await dbAll('SELECT * FROM freight_vehicles WHERE operator_id = ?', [operatorId]);
    } else if (vehicleRegNo) {
      rows = await dbAll('SELECT * FROM freight_vehicles WHERE vehicle_reg_no = ?', [vehicleRegNo]);
    } else {
      rows = await dbAll('SELECT * FROM freight_vehicles');
    }
    res.json(rows.map(mapVehicle));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transport tasks: ' + err.message });
  }
});

// 8e. Transporter: Update Live Telemetry
app.put('/api/transport/tasks/:id/telemetry', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, speedKm, direction, currentLocationName, checkpoint, status } = req.body;

    const row = await dbGet('SELECT * FROM freight_vehicles WHERE id = ? OR vehicle_reg_no = ?', [id, id]);
    if (!row) {
      return res.status(404).json({ error: 'Vehicle task not found' });
    }

    const liveLocationObj = {
      lat: parseFloat(lat) || 12.6631,
      lng: parseFloat(lng) || 75.6158,
      speedKm: parseFloat(speedKm) || 0,
      direction: direction || 'Heading towards Mandi',
      currentLocationName: currentLocationName || checkpoint || 'On Route',
      checkpoint: checkpoint || currentLocationName || 'Transit Corridor',
      status: status || 'In Transit',
      lastUpdated: new Date().toLocaleTimeString()
    };

    await dbRun('UPDATE freight_vehicles SET live_location = ? WHERE id = ?', [JSON.stringify(liveLocationObj), row.id]);

    const updated = await dbGet('SELECT * FROM freight_vehicles WHERE id = ?', [row.id]);
    res.json({ message: 'Telemetry updated', vehicle: mapVehicle(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update telemetry: ' + err.message });
  }
});

// 8f. Transporter: Get Incoming Farmer Requests for this Transporter or Nearby Corridor
app.get('/api/transport/incoming-requests', async (req, res) => {
  try {
    const { vehicleRegNo, operatorName, baseLocation } = req.query;
    const rows = await dbAll('SELECT * FROM freight_requests ORDER BY posted_at DESC');
    let filtered = rows.map(mapRequest);

    if (vehicleRegNo || operatorName || baseLocation) {
      const vClean = (vehicleRegNo || '').trim().toLowerCase();
      const oClean = (operatorName || '').trim().toLowerCase();
      const bClean = (baseLocation || '').trim().toLowerCase();

      filtered = filtered.filter(r => {
        // 1. Directly assigned to this vehicle / transporter
        if (r.assignedVehicle) {
          const rReg = (r.assignedVehicle.vehicleRegNo || '').toLowerCase();
          const rOp = (r.assignedVehicle.operatorName || r.assignedVehicle.driverName || '').toLowerCase();
          if (vClean && rReg.includes(vClean)) return true;
          if (oClean && rOp.includes(oClean)) return true;
        }

        // 2. Open or broadcast request near transporter's base location
        if (bClean && r.pickupLocation) {
          const pLoc = r.pickupLocation.toLowerCase();
          const words = bClean.split(/[\s,]+/);
          const isNearby = words.some(w => w.length > 3 && pLoc.includes(w));
          if (isNearby) return true;
        }

        return false;
      });
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incoming requests: ' + err.message });
  }
});

// 8g. Transporter: Accept Farmer Freight Request (Deducts available capacity)
app.put('/api/transport/requests/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleRegNo } = req.body || {};
    const row = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Freight request not found' });
    }

    const currentReq = mapRequest(row);
    const updatedStatus = 'Accepted (Scheduled for Pickup)';
    const updatedPayStatus = currentReq.paymentStatus && currentReq.paymentStatus.includes('PAID') 
      ? currentReq.paymentStatus 
      : (currentReq.paymentMethod === 'upi' ? 'PAID via UPI (Accepted)' : 'CONFIRMED (Cash on Pickup)');

    await dbRun(`
      UPDATE freight_requests 
      SET status = ?, payment_status = ? 
      WHERE id = ?
    `, [updatedStatus, updatedPayStatus, id]);

    // Available capacity is updated as he accepted the load from the farmer
    const targetReg = (currentReq.assignedVehicle && currentReq.assignedVehicle.vehicleRegNo) || vehicleRegNo;
    if (targetReg) {
      const weight = currentReq.weightQuintals || 0;
      await dbRun(`
        UPDATE freight_vehicles 
        SET available_capacity_quintals = MAX(0, available_capacity_quintals - ?) 
        WHERE vehicle_reg_no = ?
      `, [weight, targetReg]);
    }

    const updatedRow = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    res.json({ message: 'Freight request accepted and vehicle capacity updated', freightRequest: mapRequest(updatedRow) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept freight request: ' + err.message });
  }
});

// 8h. Transporter: Reject Farmer Freight Request (Restores Vehicle Capacity)
app.put('/api/transport/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const row = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Freight request not found' });
    }

    const currentReq = mapRequest(row);
    const wasAccepted = currentReq.status && (currentReq.status.includes('Accepted') || currentReq.status.includes('Transit'));

    // Restore vehicle capacity if it was previously accepted
    if (wasAccepted && currentReq.assignedVehicle && currentReq.assignedVehicle.vehicleRegNo) {
      const reg = currentReq.assignedVehicle.vehicleRegNo;
      const weight = currentReq.weightQuintals || 0;
      await dbRun(`
        UPDATE freight_vehicles 
        SET available_capacity_quintals = MIN(total_capacity_quintals, available_capacity_quintals + ?) 
        WHERE vehicle_reg_no = ?
      `, [weight, reg]);
    }

    // Set status to Rejected by Transporter
    await dbRun(`
      UPDATE freight_requests 
      SET status = ?, payment_status = ?, handling_notes = handling_notes || ' [Rejected: ' || ? || ']' 
      WHERE id = ?
    `, ['Rejected by Transporter', 'CANCELLED (Refund Processed)', reason || 'Transporter unable to fulfill route', id]);

    const updatedRow = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    res.json({ message: 'Freight request rejected', freightRequest: mapRequest(updatedRow) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject freight request: ' + err.message });
  }
});

// 8i. Transporter: Update Request Status (In Transit / Delivered)
app.put('/api/transport/requests/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkpoint, currentLocationName } = req.body;

    const row = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Freight request not found' });
    }

    const currentReq = mapRequest(row);
    let updatedTelemetry = currentReq.liveTelemetry || {};
    if (checkpoint || currentLocationName) {
      updatedTelemetry.currentLocationName = currentLocationName || checkpoint;
      updatedTelemetry.direction = `Status: ${status} • Checkpoint: ${checkpoint || currentLocationName}`;
    }

    await dbRun(`
      UPDATE freight_requests 
      SET status = ?, live_telemetry = ? 
      WHERE id = ?
    `, [status, JSON.stringify(updatedTelemetry), id]);

    const updatedRow = await dbGet('SELECT * FROM freight_requests WHERE id = ?', [id]);
    res.json({ message: 'Request status updated', freightRequest: mapRequest(updatedRow) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request status: ' + err.message });
  }
});

// 9. Bookings: Create Passenger Ticket (Stored in SQLite)
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      busId,
      busName,
      vehicleRegNo,
      source,
      destination,
      departureTime,
      passengerName,
      passengerPhone,
      seatCount,
      totalFare,
      paymentMethod
    } = req.body;

    const id = 'BK-' + Date.now();
    const bookingId = 'RL-KA-' + Math.floor(10000 + Math.random() * 90000);
    const payStatus = paymentMethod === 'online' ? 'PAID (UPI Confirmed)' : 'PENDING (Cash on Boarding)';
    const nowIso = new Date().toISOString();

    await dbRun(`
      INSERT INTO bookings (
        id, booking_id, bus_id, bus_name, vehicle_reg_no, source,
        destination, departure_time, passenger_name, passenger_phone,
        seat_count, total_fare, payment_method, payment_status, booked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      bookingId,
      busId || 'BUS-01',
      busName || 'Karnataka Sarige',
      vehicleRegNo || 'KA-19-F-1234',
      source || 'Kukke Subrahmanya',
      destination || 'Mangalore',
      departureTime || 'Immediate',
      passengerName || 'Passenger',
      passengerPhone || '9876543210',
      parseInt(seatCount, 10) || 1,
      parseFloat(totalFare) || 65,
      paymentMethod || 'cash',
      payStatus,
      nowIso
    ]);

    // If passenger booked a ticket on an operator travel trip, decrement available seats
    if (busId && (busId.startsWith('TRIP-') || busId.startsWith('BUS-RT-'))) {
      await dbRun(
        'UPDATE travel_trips SET available_seats = MAX(0, available_seats - ?) WHERE id = ?',
        [parseInt(seatCount, 10) || 1, busId]
      );
    }

    const createdRow = await dbGet('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json({ message: 'Booking confirmed', booking: mapBooking(createdRow) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking: ' + err.message });
  }
});

// 10. Bookings: Get Tickets
app.get('/api/bookings', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM bookings ORDER BY booked_at DESC');
    res.json(rows.map(mapBooking));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings: ' + err.message });
  }
});

// 10b. Bookings: Cancel Passenger Ticket (Restores Seat to Operator Trip)
app.put('/api/bookings/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbGet('SELECT * FROM bookings WHERE id = ? OR booking_id = ?', [id, id]);
    if (!row) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const currentBooking = mapBooking(row);
    const busId = currentBooking.busId;
    const seatCount = currentBooking.seatCount || 1;

    // Restore available seats on operator trip if applicable
    if (busId && (busId.startsWith('TRIP-') || busId.startsWith('BUS-RT-'))) {
      await dbRun(
        'UPDATE travel_trips SET available_seats = MIN(total_seats, available_seats + ?) WHERE id = ?',
        [seatCount, busId]
      );
    }

    // Update payment_status to 'CANCELLED (Refund Processed)'
    await dbRun(
      'UPDATE bookings SET payment_status = ? WHERE id = ?',
      ['CANCELLED (Refund Processed)', currentBooking.id]
    );

    const updatedRow = await dbGet('SELECT * FROM bookings WHERE id = ?', [currentBooking.id]);
    res.json({ message: 'Booking cancelled successfully', booking: mapBooking(updatedRow) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking: ' + err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbGet('SELECT * FROM bookings WHERE id = ? OR booking_id = ?', [id, id]);
    if (!row) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const currentBooking = mapBooking(row);
    const busId = currentBooking.busId;
    const seatCount = currentBooking.seatCount || 1;

    // Restore seats
    if (busId && (busId.startsWith('TRIP-') || busId.startsWith('BUS-RT-'))) {
      await dbRun(
        'UPDATE travel_trips SET available_seats = MIN(total_seats, available_seats + ?) WHERE id = ?',
        [seatCount, busId]
      );
    }

    await dbRun('DELETE FROM bookings WHERE id = ?', [currentBooking.id]);
    res.json({ message: 'Booking deleted successfully', bookingId: currentBooking.bookingId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking: ' + err.message });
  }
});

// 11. Travels: Create Route Task & Broadcast Trip (Stored in SQLite)
app.post('/api/travels/trips', async (req, res) => {
  try {
    const {
      operatorId,
      operatorName,
      operatorPhone,
      busName,
      vehicleRegNo,
      busType,
      source,
      destination,
      viaRoute,
      departureTime,
      departureDate,
      totalSeats,
      distanceKm,
      initialLat,
      initialLng
    } = req.body;

    if (!source || !destination || !departureTime) {
      return res.status(400).json({ error: 'Source, destination, and departure time are required.' });
    }

    const dist = parseFloat(distanceKm) || 52;
    // Official system declaration - locked by system tariff formula
    const systemFare = calculateOfficialTariff(dist, busType || 'Force Rural Cruiser');
    const tripId = 'TRIP-KA-' + Math.floor(100 + Math.random() * 900);
    const seatsTotal = parseInt(totalSeats, 10) || 18;

    const initialLiveLocation = JSON.stringify({
      lat: parseFloat(initialLat) || 12.6631,
      lng: parseFloat(initialLng) || 75.6158,
      speedKm: 0,
      currentStop: `${source} Main Terminal (Bay #1)`,
      direction: `Heading towards ${destination} via ${viaRoute || 'State Rural Highway'} (Compass: 310° NW)`,
      status: 'Ready to Depart',
      lastUpdated: new Date().toLocaleTimeString()
    });

    const nowIso = new Date().toISOString();

    await dbRun(`
      INSERT INTO travel_trips (
        id, operator_id, operator_name, operator_phone, bus_name, vehicle_reg_no,
        bus_type, source, destination, via_route, departure_time, departure_date,
        total_seats, available_seats, fare, system_declared_fare, distance_km,
        status, live_location, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tripId,
      operatorId || 'DEMO-TRAVELS-1',
      operatorName || 'Suresh Kumar',
      operatorPhone || '9845012345',
      busName || 'Force Cruiser Rural Maxi',
      vehicleRegNo || 'KA-21-E-4589',
      busType || 'Force Rural Cruiser (18-Seater)',
      source,
      destination,
      viaRoute || 'State Rural Highway Link',
      departureTime,
      departureDate || 'Today',
      seatsTotal,
      seatsTotal,
      systemFare,
      systemFare,
      dist,
      'Ready to Depart',
      initialLiveLocation,
      nowIso
    ]);

    const createdRow = await dbGet('SELECT * FROM travel_trips WHERE id = ?', [tripId]);
    res.status(201).json({
      message: 'Route task created and broadcasted to Passenger Dashboard successfully',
      trip: mapTrip(createdRow)
    });
  } catch (err) {
    console.error('Error creating travel trip:', err);
    res.status(500).json({ error: 'Server error creating trip: ' + err.message });
  }
});

// 12. Travels: Get Active Trips (Shared to Passenger Dashboard)
app.get('/api/travels/trips', async (req, res) => {
  try {
    const { source, destination, operatorId } = req.query;
    let query = 'SELECT * FROM travel_trips WHERE status != "Completed"';
    const params = [];

    if (operatorId) {
      query += ' AND operator_id = ?';
      params.push(operatorId);
    }

    if (source && destination) {
      query += ' AND (LOWER(source) LIKE ? OR LOWER(destination) LIKE ? OR LOWER(via_route) LIKE ?)';
      params.push(`%${source.toLowerCase().trim()}%`, `%${destination.toLowerCase().trim()}%`, `%${source.toLowerCase().trim()}%`);
    } else if (source) {
      query += ' AND (LOWER(source) LIKE ? OR LOWER(via_route) LIKE ?)';
      params.push(`%${source.toLowerCase().trim()}%`, `%${source.toLowerCase().trim()}%`);
    }

    query += ' ORDER BY created_at DESC';

    let rows = await dbAll(query, params);
    // If no strict filter match, return all active trips so passenger dashboard can still discover available buses
    if (rows.length === 0 && (source || destination)) {
      rows = await dbAll('SELECT * FROM travel_trips WHERE status != "Completed" ORDER BY created_at DESC');
    }

    res.json(rows.map(mapTrip));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch travel trips: ' + err.message });
  }
});

// 13. Travels: Update Live Location & Telemetry Broadcast
app.put('/api/travels/trips/:tripId/live-location', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { lat, lng, speedKm, currentStop, direction, status } = req.body;

    const existing = await dbGet('SELECT * FROM travel_trips WHERE id = ?', [tripId]);
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    let liveObj = {};
    try {
      liveObj = typeof existing.live_location === 'string' ? JSON.parse(existing.live_location) : existing.live_location;
    } catch (e) {
      liveObj = {};
    }

    const updatedLiveObj = {
      ...liveObj,
      lat: lat !== undefined ? parseFloat(lat) : liveObj.lat,
      lng: lng !== undefined ? parseFloat(lng) : liveObj.lng,
      speedKm: speedKm !== undefined ? parseInt(speedKm, 10) : liveObj.speedKm,
      currentStop: currentStop || liveObj.currentStop,
      direction: direction || liveObj.direction,
      status: status || liveObj.status,
      lastUpdated: new Date().toLocaleTimeString()
    };

    await dbRun(`
      UPDATE travel_trips
      SET live_location = ?, status = COALESCE(?, status)
      WHERE id = ?
    `, [
      JSON.stringify(updatedLiveObj),
      status || null,
      tripId
    ]);

    const updated = await dbGet('SELECT * FROM travel_trips WHERE id = ?', [tripId]);
    res.json({ message: 'Live location broadcasted successfully', trip: mapTrip(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update live location: ' + err.message });
  }
});

// 14. Travels: Get Bookings for a Specific Trip
app.get('/api/travels/trips/:tripId/bookings', async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await dbGet('SELECT * FROM travel_trips WHERE id = ?', [tripId]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const bookings = await dbAll(
      'SELECT * FROM bookings WHERE bus_id = ? OR vehicle_reg_no = ? ORDER BY booked_at DESC',
      [tripId, trip.vehicle_reg_no]
    );

    res.json(bookings.map(mapBooking));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trip bookings: ' + err.message });
  }
});

// Serve built production frontend if dist exists
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Universal SPA fallback for Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Initialize SQLite Database and Start Express Server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 Rural Link Backend API connected to SQLite database`);
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to initialize SQLite database:', err);
    process.exit(1);
  }
}

startServer();
