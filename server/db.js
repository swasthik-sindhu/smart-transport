import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'rurallink.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Could not connect to SQLite database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database:', DB_PATH);
  }
});

// Helper functions for Promises
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize Tables and Initial Seeds
export async function initDb() {
  // 1. Users Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT,
      name TEXT UNIQUE,
      phone TEXT UNIQUE,
      email TEXT,
      password TEXT,
      operator_type TEXT,
      vehicle_name TEXT,
      vehicle_reg_no TEXT,
      seating_capacity INTEGER,
      loading_capacity TEXT,
      upi_id TEXT,
      location TEXT,
      created_at TEXT
    )
  `);

  // Helper to ensure columns exist dynamically
  const ensureColumnExists = async (table, column, definition) => {
    try {
      const cols = await dbAll(`PRAGMA table_info(${table})`);
      const exists = cols.some(c => c.name === column);
      if (!exists) {
        await dbRun(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`✅ Added column ${column} to table ${table}`);
      }
    } catch (err) {
      console.error(`Migration check error on ${table}.${column}:`, err.message);
    }
  };

  // 2. Freight Vehicles Table (Operator Fleets available to farmers)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS freight_vehicles (
      id TEXT PRIMARY KEY,
      operator_id TEXT,
      operator_name TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      vehicle_name TEXT,
      vehicle_reg_no TEXT,
      vehicle_type TEXT,
      base_location TEXT,
      destination_market TEXT,
      via_route TEXT,
      total_capacity_quintals REAL,
      available_capacity_quintals REAL,
      rate_per_quintal REAL,
      allowed_goods TEXT,
      is_shared INTEGER DEFAULT 1,
      shared_pricing_rule TEXT,
      upi_id TEXT,
      departure_schedule TEXT,
      live_location TEXT,
      rating REAL
    )
  `);

  await ensureColumnExists('freight_vehicles', 'operator_id', 'TEXT');
  await ensureColumnExists('freight_vehicles', 'via_route', 'TEXT');
  await ensureColumnExists('freight_vehicles', 'allowed_goods', 'TEXT');
  await ensureColumnExists('freight_vehicles', 'is_shared', 'INTEGER DEFAULT 1');
  await ensureColumnExists('freight_vehicles', 'shared_pricing_rule', 'TEXT');
  await ensureColumnExists('freight_vehicles', 'live_location', 'TEXT');

  // 3. Freight Requests Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS freight_requests (
      id TEXT PRIMARY KEY,
      farmer_name TEXT,
      farmer_phone TEXT,
      crop_type TEXT,
      weight_quintals REAL,
      pickup_location TEXT,
      target_mandi TEXT,
      delivery_schedule TEXT,
      assigned_vehicle TEXT,
      status TEXT,
      payment_method TEXT,
      total_freight REAL,
      payment_status TEXT,
      transporter_upi_id TEXT,
      live_telemetry TEXT,
      handling_notes TEXT,
      posted_at TEXT
    )
  `);

  await ensureColumnExists('freight_requests', 'transporter_upi_id', 'TEXT');

  // 4. Passenger Bookings Table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_id TEXT UNIQUE,
      bus_id TEXT,
      bus_name TEXT,
      vehicle_reg_no TEXT,
      source TEXT,
      destination TEXT,
      departure_time TEXT,
      passenger_name TEXT,
      passenger_phone TEXT,
      seat_count INTEGER,
      total_fare REAL,
      payment_method TEXT,
      payment_status TEXT,
      booked_at TEXT
    )
  `);

  // 5. Travel Operator Trips Table (Route Tasks created by Travels Operators)
  await dbRun(`
    CREATE TABLE IF NOT EXISTS travel_trips (
      id TEXT PRIMARY KEY,
      operator_id TEXT,
      operator_name TEXT,
      operator_phone TEXT,
      bus_name TEXT,
      vehicle_reg_no TEXT,
      bus_type TEXT,
      source TEXT,
      destination TEXT,
      via_route TEXT,
      departure_time TEXT,
      departure_date TEXT,
      total_seats INTEGER,
      available_seats INTEGER,
      fare REAL,
      system_declared_fare REAL,
      distance_km REAL,
      status TEXT,
      live_location TEXT,
      created_at TEXT
    )
  `);

  // Seed default demo users if empty
  const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await dbRun(`
      INSERT INTO users (id, role, name, phone, email, password, operator_type, vehicle_name, vehicle_reg_no, seating_capacity, loading_capacity, upi_id, location, created_at)
      VALUES 
      ('DEMO-FARMER-1', 'farmer', 'Ramesh Patel', '9876543210', 'ramesh.farmer@rurallink.in', 'password123', NULL, NULL, NULL, NULL, NULL, NULL, 'Kukke Subrahmanya, Dakshina Kannada', datetime('now')),
      ('DEMO-TRAVELS-1', 'operator', 'Suresh Kumar', '9845012345', 'suresh.travels@rurallink.in', 'password123', 'travels', 'Force Cruiser Rural Maxi', 'KA-21-E-4589', 18, NULL, 'sureshtravels@okaxis', 'Mangalore, Dakshina Kannada', datetime('now')),
      ('DEMO-CARGO-1', 'operator', 'Balaji Transport Co.', '9741234567', 'balaji.cargo@rurallink.in', 'password123', 'transport', 'Tata Ace Gold (Chota Hathi)', 'KA-19-MH-8842', NULL, '1.5 Tons (1500 kg)', 'balajitransport@upi', 'Kukke Subrahmanya, Dakshina Kannada', datetime('now'))
    `);
  }

  // Seed default freight vehicles if empty
  const vehicleCount = await dbGet('SELECT COUNT(*) as count FROM freight_vehicles');
  if (vehicleCount.count === 0) {
    await dbRun(`
      INSERT INTO freight_vehicles (id, operator_name, driver_name, driver_phone, vehicle_name, vehicle_reg_no, vehicle_type, base_location, destination_market, total_capacity_quintals, available_capacity_quintals, rate_per_quintal, upi_id, departure_schedule, rating)
      VALUES
      ('VEH-01', 'Balaji Rural Cargo', 'Manjunath Gowda', '9844012399', 'Tata Ace Gold (Chota Hathi)', 'KA-19-MH-8842', 'Mini Truck (1.5 Ton)', 'Kukke Subrahmanya', 'Mangalore Baikampady APMC', 15, 7, 45, 'balajitransport@upi', 'Today, 04:30 PM', 4.8),
      ('VEH-02', 'Netravati Krishi Logistics', 'Shekar Poojary', '9880098765', 'Mahindra Bolero Maxi Truck Plus', 'KA-21-B-3312', 'Pickup Truck (2.0 Ton)', 'Dharmasthala / Ujire', 'Mangalore Baikampady APMC', 20, 12, 40, 'netravati.cargo@okaxis', 'Tonight, 08:00 PM (Night Mandi Express)', 4.9),
      ('VEH-03', 'Cauvery Grama Vahini', 'Basavarajappa', '9741001122', 'Swaraj 855 Tractor Trolley', 'KA-11-TR-9040', 'Heavy Agricultural Trolley (4.0 Ton)', 'Maddur / Mandya', 'Mandya APMC Sugar & Jaggery Market', 40, 22, 30, 'basava.tractor@upi', 'Tomorrow, 06:00 AM (Early Auction)', 4.7),
      ('VEH-04', 'Malnad Farmers Freight Co-op', 'Girish Kumar', '9448123456', 'Eicher Pro 2049 Light Truck', 'KA-13-A-6712', 'Medium Freight Truck (3.5 Ton)', 'Hassan / Sakleshpur', 'Bengaluru Yeshwanthpur APMC', 35, 18, 65, 'malnadfreight@okicici', 'Tonight, 10:00 PM', 4.9)
    `);
  }

  // Seed active consignment if empty
  const reqCount = await dbGet('SELECT COUNT(*) as count FROM freight_requests');
  if (reqCount.count === 0) {
    const defaultTelemetry = JSON.stringify({
      currentLocationName: 'Approaching Bantwal B.C. Road Junction',
      lat: 12.8797,
      lng: 75.0344,
      speedKm: 44,
      direction: 'North-West (315° NW) heading directly towards Mangalore APMC on NH-73',
      distanceRemainingKm: 26,
      etaMinutes: 38,
      milestones: [
        { title: 'Produce Loaded at Farm', status: 'completed', time: '07:30 AM' },
        { title: 'Dispatched via Gundya & Kokkada', status: 'completed', time: '08:45 AM' },
        { title: 'Passed Dharmasthala / Ujire Bypass', status: 'completed', time: '09:40 AM' },
        { title: 'Current: Bantwal Highway Crossing', status: 'active', time: 'Live Now' },
        { title: 'Mandi Weighbridge & Final Unloading', status: 'pending', time: 'Est. 10:30 AM' }
      ]
    });

    const defaultVehicle = JSON.stringify({
      vehicleRegNo: 'KA-19-MH-8842',
      driverName: 'Manjunath Gowda',
      driverPhone: '9844012399',
      vehicleName: 'Tata Ace Gold'
    });

    await dbRun(`
      INSERT INTO freight_requests (id, farmer_name, farmer_phone, crop_type, weight_quintals, pickup_location, target_mandi, delivery_schedule, assigned_vehicle, status, payment_method, total_freight, payment_status, live_telemetry, handling_notes, posted_at)
      VALUES 
      ('FR-KA-8801', 'Ramesh Patel', '9876543210', 'Arecanut & Tender Coconut', 8.5, 'Kukke Subrahmanya Farm Yard', 'Mangalore Baikampady APMC', 'Tomorrow, Before 09:00 AM (Morning Auction)', ?, 'In Transit', 'upi', 382.5, 'PAID via UPI', ?, 'Moisture sensitive, dry produce crates', datetime('now', '-1 hour'))
    `, [defaultVehicle, defaultTelemetry]);
  }

  // Seed default travel trip if empty
  const tripCount = await dbGet('SELECT COUNT(*) as count FROM travel_trips');
  if (tripCount.count === 0) {
    const demoLiveLocation = JSON.stringify({
      lat: 12.6631,
      lng: 75.6158,
      speedKm: 0,
      currentStop: 'Kukke Subrahmanya Main Bus Stand (Bay #2)',
      direction: 'Heading North-West towards Dharmasthala on NH-73 (Compass: 310° NW)',
      status: 'Boarding Passengers',
      lastUpdated: 'Live GPS'
    });

    await dbRun(`
      INSERT INTO travel_trips (
        id, operator_id, operator_name, operator_phone, bus_name, vehicle_reg_no,
        bus_type, source, destination, via_route, departure_time, departure_date,
        total_seats, available_seats, fare, system_declared_fare, distance_km,
        status, live_location, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      'TRIP-KA-101',
      'DEMO-TRAVELS-1',
      'Suresh Kumar',
      '9845012345',
      'Suresh Rural Express (Force Cruiser)',
      'KA-21-E-4589',
      'Force Cruiser Rural Maxi (18-Seater)',
      'Kukke Subrahmanya',
      'Dharmasthala',
      'NH-73 via Gundya, Kokkada & Ujire Bypass',
      '04:30 PM',
      'Today',
      18,
      11,
      65,
      65,
      54,
      'Boarding',
      demoLiveLocation
    ]);
  }

  console.log('✅ SQLite Schema initialized and seeded.');
}

export default db;
