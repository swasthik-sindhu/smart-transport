import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Writable directory for database persistence (uses /tmp on Vercel, server/data on Render/Local)
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'rural-link-data') : path.join(__dirname, 'data');
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Note on DATA_DIR creation:', e.message);
}

const JSON_PATH = path.join(DATA_DIR, 'rurallink.json');

// In-memory data store with file persistence (Zero C++ bindings, 100% immune to ERR_DLOPEN_FAILED)
let tables = {
  users: [],
  freight_vehicles: [],
  freight_requests: [],
  bookings: [],
  travel_trips: []
};

function saveDb() {
  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(tables, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to persist database to JSON:', err.message);
  }
}

function loadDb() {
  try {
    if (fs.existsSync(JSON_PATH)) {
      const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
      tables = {
        users: data.users || [],
        freight_vehicles: data.freight_vehicles || [],
        freight_requests: data.freight_requests || [],
        bookings: data.bookings || [],
        travel_trips: data.travel_trips || []
      };
      console.log('✅ Loaded database from file with', tables.users.length, 'users,', tables.freight_vehicles.length, 'vehicles');
    }
  } catch (err) {
    console.warn('Initializing fresh store, failed to read existing JSON:', err.message);
  }
}

// ---------------------- PURE JS SQL COMPATIBILITY LAYER ---------------------- //

export function dbRun(sql, params = []) {
  return new Promise((resolve) => {
    const trimmed = sql.trim();
    const cleanSql = trimmed.replace(/\s+/g, ' ');

    // 1. DDL: CREATE TABLE / ALTER TABLE / PRAGMA
    if (cleanSql.toUpperCase().startsWith('CREATE TABLE') || 
        cleanSql.toUpperCase().startsWith('ALTER TABLE') || 
        cleanSql.toUpperCase().startsWith('PRAGMA')) {
      const match = cleanSql.match(/CREATE TABLE (?:IF NOT EXISTS )?([a-zA-Z0-9_]+)/i);
      if (match && match[1]) {
        const tbl = match[1].toLowerCase();
        if (!tables[tbl]) tables[tbl] = [];
      }
      return resolve({ id: null, changes: 0 });
    }

    // 2. INSERT INTO
    if (cleanSql.toUpperCase().startsWith('INSERT INTO')) {
      const tableMatch = cleanSql.match(/INSERT INTO ([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*(.*)/is);
      if (tableMatch) {
        const tbl = tableMatch[1].toLowerCase();
        if (!tables[tbl]) tables[tbl] = [];
        const columns = tableMatch[2].split(',').map(c => c.trim().toLowerCase());
        const valuesBlock = tableMatch[3].trim();

        // Handle one or multiple row tuples: (...), (...)
        const rowTuples = [];
        let depth = 0;
        let start = -1;
        for (let i = 0; i < valuesBlock.length; i++) {
          if (valuesBlock[i] === '(') {
            if (depth === 0) start = i + 1;
            depth++;
          } else if (valuesBlock[i] === ')') {
            depth--;
            if (depth === 0 && start !== -1) {
              rowTuples.push(valuesBlock.substring(start, i));
              start = -1;
            }
          }
        }

        let paramIdx = 0;
        let lastId = null;

        for (const tuple of rowTuples) {
          const rawVals = splitSqlValues(tuple);
          const newRow = {};

          columns.forEach((col, idx) => {
            const rawVal = rawVals[idx] !== undefined ? rawVals[idx].trim() : 'NULL';
            if (rawVal === '?') {
              newRow[col] = params[paramIdx++];
            } else if (rawVal.toLowerCase() === "datetime('now')") {
              newRow[col] = new Date().toISOString();
            } else if (rawVal.toLowerCase() === "datetime('now', '-1 hour')") {
              newRow[col] = new Date(Date.now() - 3600000).toISOString();
            } else if (rawVal.toLowerCase() === 'null') {
              newRow[col] = null;
            } else if (rawVal.startsWith("'") && rawVal.endsWith("'")) {
              newRow[col] = rawVal.slice(1, -1);
            } else if (!isNaN(Number(rawVal))) {
              newRow[col] = Number(rawVal);
            } else {
              newRow[col] = rawVal;
            }
          });

          // Ensure primary key exists
          if (!newRow.id) {
            newRow.id = 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          }
          lastId = newRow.id;

          // Replace existing if primary key / unique matches, or append
          const existingIdx = tables[tbl].findIndex(r => r.id === newRow.id || (newRow.name && r.name && r.name.toLowerCase() === newRow.name.toLowerCase()));
          if (existingIdx !== -1) {
            tables[tbl][existingIdx] = { ...tables[tbl][existingIdx], ...newRow };
          } else {
            tables[tbl].push(newRow);
          }
        }

        saveDb();
        return resolve({ id: lastId, changes: rowTuples.length });
      }
    }

    // 3. UPDATE
    if (cleanSql.toUpperCase().startsWith('UPDATE')) {
      const match = cleanSql.match(/UPDATE ([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/is);
      if (match) {
        const tbl = match[1].toLowerCase();
        const setClause = match[2];
        const whereClause = match[3] || '';
        const rows = tables[tbl] || [];

        let paramIdx = 0;
        const setAssignments = splitSqlValues(setClause);
        const setOps = [];

        for (const assign of setAssignments) {
          const parts = assign.split('=');
          if (parts.length >= 2) {
            const col = parts[0].trim().toLowerCase();
            const expr = parts.slice(1).join('=').trim();
            if (expr === '?') {
              const val = params[paramIdx++];
              setOps.push((row) => { row[col] = val; });
            } else if (expr.toLowerCase().includes('min(total_capacity_quintals')) {
              // Capacity restoration: MIN(total_capacity_quintals, available_capacity_quintals + ?)
              const addVal = params[paramIdx++];
              setOps.push((row) => {
                const total = parseFloat(row.total_capacity_quintals) || 0;
                const cur = parseFloat(row.available_capacity_quintals) || 0;
                row.available_capacity_quintals = Math.min(total, cur + parseFloat(addVal));
              });
            } else if (expr.toLowerCase().includes('max(0, available_capacity_quintals - ?)')) {
              // Capacity deduction: MAX(0, available_capacity_quintals - ?)
              const subVal = params[paramIdx++];
              setOps.push((row) => {
                const cur = parseFloat(row.available_capacity_quintals) || 0;
                row.available_capacity_quintals = Math.max(0, cur - parseFloat(subVal));
              });
            } else if (expr.startsWith("'") && expr.endsWith("'")) {
              const val = expr.slice(1, -1);
              setOps.push((row) => { row[col] = val; });
            } else if (!isNaN(Number(expr))) {
              const val = Number(expr);
              setOps.push((row) => { row[col] = val; });
            } else {
              setOps.push((row) => { row[col] = expr; });
            }
          }
        }

        // Remaining params are for WHERE clause
        const whereParams = params.slice(paramIdx);
        let changes = 0;

        for (const row of rows) {
          if (evaluateWhere(row, whereClause, whereParams)) {
            setOps.forEach(op => op(row));
            changes++;
          }
        }

        saveDb();
        return resolve({ changes });
      }
    }

    // 4. DELETE
    if (cleanSql.toUpperCase().startsWith('DELETE FROM')) {
      const match = cleanSql.match(/DELETE FROM ([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?$/is);
      if (match) {
        const tbl = match[1].toLowerCase();
        const whereClause = match[2] || '';
        const initialCount = (tables[tbl] || []).length;
        tables[tbl] = (tables[tbl] || []).filter(row => !evaluateWhere(row, whereClause, params));
        const changes = initialCount - tables[tbl].length;
        saveDb();
        return resolve({ changes });
      }
    }

    resolve({ changes: 0 });
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve) => {
    const trimmed = sql.trim().replace(/\s+/g, ' ');

    // 1. SELECT COUNT(*)
    if (trimmed.toUpperCase().includes('SELECT COUNT(*)')) {
      const match = trimmed.match(/FROM ([a-zA-Z0-9_]+)/i);
      const tbl = match ? match[1].toLowerCase() : '';
      const count = (tables[tbl] || []).length;
      return resolve({ count });
    }

    // 2. Standard SELECT single row
    const match = trimmed.match(/SELECT .+? FROM ([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+))?$/is);
    if (match) {
      const tbl = match[1].toLowerCase();
      const whereClause = match[2] || '';
      let rows = [...(tables[tbl] || [])];

      if (whereClause) {
        rows = rows.filter(row => evaluateWhere(row, whereClause, params));
      }

      if (match[3]) {
        rows = sortRows(rows, match[3]);
      }

      return resolve(rows[0] ? { ...rows[0] } : null);
    }

    resolve(null);
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve) => {
    const trimmed = sql.trim().replace(/\s+/g, ' ');

    // PRAGMA table_info
    if (trimmed.toUpperCase().startsWith('PRAGMA TABLE_INFO')) {
      const match = trimmed.match(/PRAGMA TABLE_INFO\(([a-zA-Z0-9_]+)\)/i);
      const tbl = match ? match[1].toLowerCase() : '';
      const cols = tables[tbl] && tables[tbl][0] ? Object.keys(tables[tbl][0]).map(k => ({ name: k })) : [];
      return resolve(cols);
    }

    // Standard SELECT multiple rows
    const match = trimmed.match(/SELECT .+? FROM ([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+))?$/is);
    if (match) {
      const tbl = match[1].toLowerCase();
      const whereClause = match[2] || '';
      let rows = [...(tables[tbl] || [])];

      if (whereClause) {
        rows = rows.filter(row => evaluateWhere(row, whereClause, params));
      }

      if (match[3]) {
        rows = sortRows(rows, match[3]);
      }

      return resolve(rows.map(r => ({ ...r })));
    }

    resolve([]);
  });
}

// Helper: Split comma-separated SQL arguments taking quotes and parentheses into account
function splitSqlValues(str) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let parenDepth = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inQuotes) {
      current += char;
      if (char === quoteChar) inQuotes = false;
    } else if (char === "'" || char === '"') {
      inQuotes = true;
      quoteChar = char;
      current += char;
    } else if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

// Helper: Evaluate WHERE clause against a row
function evaluateWhere(row, whereClause, params) {
  if (!whereClause || !whereClause.trim()) return true;
  const clean = whereClause.trim();

  // Simple matches
  let pIdx = 0;

  // Multi-OR conditions (e.g. name = ? OR phone = ? OR email = ?)
  if (clean.includes(' OR ') && !clean.includes(' AND ')) {
    const orParts = clean.split(/\s+OR\s+/i);
    for (const part of orParts) {
      const match = part.trim().match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
      if (match) {
        const col = match[1].toLowerCase();
        let target = match[2].trim();
        let compareVal = target === '?' ? params[pIdx++] : (target.startsWith("'") ? target.slice(1, -1) : target);
        const rowVal = row[col];
        if (rowVal !== undefined && rowVal !== null) {
          if (String(rowVal).toLowerCase() === String(compareVal).toLowerCase()) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Multi-AND conditions (e.g. id = ? AND status = ?)
  const andParts = clean.split(/\s+AND\s+/i);
  for (const part of andParts) {
    // Check !=
    let match = part.trim().match(/^([a-zA-Z0-9_]+)\s*!=\s*(.+)$/);
    if (match) {
      const col = match[1].toLowerCase();
      let target = match[2].trim();
      let compareVal = target === '?' ? params[pIdx++] : (target.startsWith("'") ? target.slice(1, -1) : target);
      if (String(row[col] || '').toLowerCase() === String(compareVal).toLowerCase()) {
        return false;
      }
      continue;
    }

    // Check =
    match = part.trim().match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
    if (match) {
      const col = match[1].toLowerCase();
      let target = match[2].trim();
      let compareVal = target === '?' ? params[pIdx++] : (target.startsWith("'") ? target.slice(1, -1) : target);
      if (String(row[col] || '').toLowerCase() !== String(compareVal).toLowerCase()) {
        return false;
      }
      continue;
    }
  }

  return true;
}

// Helper: Sort rows by ORDER BY clause
function sortRows(rows, orderClause) {
  const parts = orderClause.trim().split(/\s+/);
  const col = parts[0].toLowerCase();
  const isDesc = parts[1] && parts[1].toUpperCase() === 'DESC';

  return rows.sort((a, b) => {
    let va = a[col] !== undefined ? a[col] : '';
    let vb = b[col] !== undefined ? b[col] : '';

    if (typeof va === 'number' && typeof vb === 'number') {
      return isDesc ? vb - va : va - vb;
    }
    return isDesc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
  });
}

// ---------------------- DATABASE INITIALIZATION & SEEDS ---------------------- //

export async function initDb() {
  loadDb();

  // Seed default demo users if empty
  if (tables.users.length === 0) {
    tables.users.push(
      {
        id: 'DEMO-FARMER-1',
        role: 'farmer',
        name: 'Ramesh Patel',
        phone: '9876543210',
        email: 'ramesh.farmer@rurallink.in',
        password: 'password123',
        operator_type: null,
        vehicle_name: null,
        vehicle_reg_no: null,
        seating_capacity: null,
        loading_capacity: null,
        upi_id: null,
        location: 'Kukke Subrahmanya, Dakshina Kannada',
        created_at: new Date().toISOString()
      },
      {
        id: 'DEMO-TRAVELS-1',
        role: 'operator',
        name: 'Suresh Kumar',
        phone: '9845012345',
        email: 'suresh.travels@rurallink.in',
        password: 'password123',
        operator_type: 'travels',
        vehicle_name: 'Force Cruiser Rural Maxi',
        vehicle_reg_no: 'KA-21-E-4589',
        seating_capacity: 18,
        loading_capacity: null,
        upi_id: 'sureshtravels@okaxis',
        location: 'Mangalore, Dakshina Kannada',
        created_at: new Date().toISOString()
      },
      {
        id: 'DEMO-CARGO-1',
        role: 'operator',
        name: 'Balaji Transport Co.',
        phone: '9741234567',
        email: 'balaji.cargo@rurallink.in',
        password: 'password123',
        operator_type: 'transport',
        vehicle_name: 'Tata Ace Gold (Chota Hathi)',
        vehicle_reg_no: 'KA-19-MH-8842',
        seating_capacity: null,
        loading_capacity: '1.5 Tons (1500 kg)',
        upi_id: 'balajitransport@upi',
        location: 'Kukke Subrahmanya, Dakshina Kannada',
        created_at: new Date().toISOString()
      }
    );
  }

  // Seed default freight vehicles if empty
  if (tables.freight_vehicles.length === 0) {
    tables.freight_vehicles.push(
      {
        id: 'VEH-01',
        operator_id: 'DEMO-CARGO-1',
        operator_name: 'Balaji Rural Cargo',
        driver_name: 'Manjunath Gowda',
        driver_phone: '9844012399',
        vehicle_name: 'Tata Ace Gold (Chota Hathi)',
        vehicle_reg_no: 'KA-19-MH-8842',
        vehicle_type: 'Mini Truck (1.5 Ton)',
        base_location: 'Kukke Subrahmanya',
        destination_market: 'Mangalore Baikampady APMC',
        via_route: 'NH-73 via Gundya, Ujire Bypass & Bantwal B.C. Road',
        total_capacity_quintals: 20,
        available_capacity_quintals: 14,
        rate_per_quintal: 45,
        allowed_goods: '["Arecanut & Coconuts", "Tomatoes & Vegetables", "Sugarcane", "Paddy / Rice"]',
        is_shared: 1,
        shared_pricing_rule: 'Proportional Load & Distance Split',
        upi_id: 'balajitransport@upi',
        departure_schedule: 'Today, 04:30 PM',
        live_location: JSON.stringify({
          lat: 12.6625,
          lng: 75.5900,
          speedKm: 42,
          currentLocationName: 'Gundya Highway Junction',
          status: 'Accepting Produce Cargo',
          direction: 'Heading towards Mangalore on NH-73'
        }),
        rating: 4.8
      },
      {
        id: 'VEH-02',
        operator_id: 'DEMO-CARGO-2',
        operator_name: 'Netravati Krishi Logistics',
        driver_name: 'Shekar Poojary',
        driver_phone: '9880098765',
        vehicle_name: 'Mahindra Bolero Maxi Truck Plus',
        vehicle_reg_no: 'KA-21-B-3312',
        vehicle_type: 'Pickup Truck (2.0 Ton)',
        base_location: 'Dharmasthala / Ujire',
        destination_market: 'Mangalore Baikampady APMC',
        via_route: 'NH-73 via Bantwal Bypass',
        total_capacity_quintals: 20,
        available_capacity_quintals: 12,
        rate_per_quintal: 40,
        allowed_goods: '["Arecanut & Coconuts", "Tomatoes & Vegetables", "Sugarcane", "Paddy / Rice"]',
        is_shared: 1,
        shared_pricing_rule: 'Proportional Load & Distance Split',
        upi_id: 'netravati.cargo@okaxis',
        departure_schedule: 'Tonight, 08:00 PM (Night Mandi Express)',
        live_location: null,
        rating: 4.9
      }
    );
  }

  // Seed default travel trip if empty
  if (tables.travel_trips.length === 0) {
    tables.travel_trips.push({
      id: 'TRIP-KA-101',
      operator_id: 'DEMO-TRAVELS-1',
      operator_name: 'Suresh Kumar',
      operator_phone: '9845012345',
      bus_name: 'Suresh Rural Express (Force Cruiser)',
      vehicle_reg_no: 'KA-21-E-4589',
      bus_type: 'Force Cruiser Rural Maxi (18-Seater)',
      source: 'Kukke Subrahmanya',
      destination: 'Dharmasthala',
      via_route: 'NH-73 via Gundya, Kokkada & Ujire Bypass',
      departure_time: '04:30 PM',
      departure_date: 'Today',
      total_seats: 18,
      available_seats: 11,
      fare: 65,
      system_declared_fare: 65,
      distance_km: 46,
      status: 'Boarding Passengers',
      live_location: JSON.stringify({
        lat: 12.6631,
        lng: 75.6158,
        speedKm: 0,
        currentStop: 'Kukke Subrahmanya Main Bus Stand (Bay #2)',
        direction: 'Heading North-West towards Dharmasthala on NH-73 (Compass: 310° NW)',
        status: 'Boarding Passengers',
        lastUpdated: 'Live GPS'
      }),
      created_at: new Date().toISOString()
    });
  }

  saveDb();
  console.log('✅ Rural Link Embedded Database initialized and seeded successfully.');
  return true;
}

export default { dbRun, dbGet, dbAll, initDb };
