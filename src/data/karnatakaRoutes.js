// Comprehensive Statewide Karnataka Transit Network & Real-Time Routing Engine

export const KARNATAKA_LOCATIONS = [
  // Coastal & Western Ghats
  { id: 'kukke', name: 'Kukke Subrahmanya', district: 'Dakshina Kannada', lat: 12.6631, lng: 75.6158 },
  { id: 'dharmasthala', name: 'Dharmasthala', district: 'Dakshina Kannada', lat: 12.9566, lng: 75.3802 },
  { id: 'mangalore', name: 'Mangalore (Mangaluru)', district: 'Dakshina Kannada', lat: 12.8698, lng: 74.8430 },
  { id: 'ujire', name: 'Ujire / Belthangady', district: 'Dakshina Kannada', lat: 12.9972, lng: 75.3283 },
  { id: 'bantwal', name: 'Bantwal (B.C. Road)', district: 'Dakshina Kannada', lat: 12.8797, lng: 75.0344 },
  { id: 'puttur', name: 'Puttur', district: 'Dakshina Kannada', lat: 12.7661, lng: 75.2036 },
  { id: 'sullia', name: 'Sullia', district: 'Dakshina Kannada', lat: 12.5606, lng: 75.3908 },
  { id: 'udupi', name: 'Udupi', district: 'Udupi', lat: 13.3409, lng: 74.7421 },
  { id: 'karkala', name: 'Karkala', district: 'Udupi', lat: 13.2144, lng: 74.9961 },
  { id: 'kundapura', name: 'Kundapura', district: 'Udupi', lat: 13.6268, lng: 74.6917 },
  { id: 'karwar', name: 'Karwar', district: 'Uttara Kannada', lat: 14.8185, lng: 74.1352 },
  { id: 'bhatkal', name: 'Bhatkal', district: 'Uttara Kannada', lat: 13.9786, lng: 74.5552 },
  { id: 'sirsi', name: 'Sirsi', district: 'Uttara Kannada', lat: 14.6195, lng: 74.8441 },

  // South Karnataka / Mysuru Region
  { id: 'mysuru', name: 'Mysuru (Sub-Urban CBS)', district: 'Mysuru', lat: 12.2958, lng: 76.6394 },
  { id: 'mandya', name: 'Mandya (Sugar City)', district: 'Mandya', lat: 12.5226, lng: 76.8974 },
  { id: 'maddur', name: 'Maddur', district: 'Mandya', lat: 12.5843, lng: 77.0450 },
  { id: 'channapatna', name: 'Channapatna', district: 'Ramanagara', lat: 12.6518, lng: 77.2089 },
  { id: 'ramanagara', name: 'Ramanagara', district: 'Ramanagara', lat: 12.7209, lng: 77.2799 },
  { id: 'kanakapura', name: 'Kanakapura', district: 'Ramanagara', lat: 12.5463, lng: 77.4194 },
  { id: 'chamarajanagar', name: 'Chamarajanagar', district: 'Chamarajanagar', lat: 11.9261, lng: 76.9437 },
  { id: 'kollegal', name: 'Kollegal', district: 'Chamarajanagar', lat: 12.1554, lng: 77.1126 },
  { id: 'nanjangud', name: 'Nanjangud (Temple Town)', district: 'Mysuru', lat: 12.1192, lng: 76.6811 },
  { id: 'hunsur', name: 'Hunsur', district: 'Mysuru', lat: 12.3089, lng: 76.2923 },

  // Bengaluru Urban & Rural
  { id: 'bengaluru', name: 'Bengaluru (Majestic / KSRTC)', district: 'Bengaluru Urban', lat: 12.9767, lng: 77.5713 },
  { id: 'doddaballapura', name: 'Doddaballapura Rural', district: 'Bengaluru Rural', lat: 13.2928, lng: 77.5429 },
  { id: 'nelamangala', name: 'Nelamangala Hub', district: 'Bengaluru Rural', lat: 13.0970, lng: 77.3929 },
  { id: 'chikkaballapura', name: 'Chikkaballapura', district: 'Chikkaballapura', lat: 13.4325, lng: 77.7275 },
  { id: 'kolar', name: 'Kolar', district: 'Kolar', lat: 13.1367, lng: 78.1291 },

  // Malnad & Central Karnataka
  { id: 'hassan', name: 'Hassan CBS', district: 'Hassan', lat: 13.0072, lng: 76.1030 },
  { id: 'belur', name: 'Belur Rural Hub', district: 'Hassan', lat: 13.1623, lng: 75.8647 },
  { id: 'sakleshpur', name: 'Sakleshpur', district: 'Hassan', lat: 12.9442, lng: 75.7854 },
  { id: 'chikkamagaluru', name: 'Chikkamagaluru', district: 'Chikkamagaluru', lat: 13.3153, lng: 75.7754 },
  { id: 'shivamogga', name: 'Shivamogga (Shimoga)', district: 'Shivamogga', lat: 13.9299, lng: 75.5681 },
  { id: 'sagara', name: 'Sagara (Jog Falls Link)', district: 'Shivamogga', lat: 14.1667, lng: 75.0333 },
  { id: 'bhadravathi', name: 'Bhadravathi', district: 'Shivamogga', lat: 13.8407, lng: 75.7032 },
  { id: 'tumakuru', name: 'Tumakuru Rural', district: 'Tumakuru', lat: 13.3409, lng: 77.1010 },
  { id: 'tiptur', name: 'Tiptur (Copra APMC)', district: 'Tumakuru', lat: 13.2564, lng: 76.4789 },
  { id: 'chitradurga', name: 'Chitradurga (Fort City)', district: 'Chitradurga', lat: 14.2251, lng: 76.3980 },
  { id: 'davanagere', name: 'Davanagere', district: 'Davanagere', lat: 14.4644, lng: 75.9218 },

  // Kittur & North Karnataka
  { id: 'hubballi', name: 'Hubballi (Hubli Central)', district: 'Dharwad', lat: 15.3647, lng: 75.1240 },
  { id: 'dharwad', name: 'Dharwad Old Bus Stand', district: 'Dharwad', lat: 15.4589, lng: 75.0078 },
  { id: 'belagavi', name: 'Belagavi Central', district: 'Belagavi', lat: 15.8497, lng: 74.4977 },
  { id: 'bailhongal', name: 'Bailhongal APMC', district: 'Belagavi', lat: 15.8153, lng: 74.8569 },
  { id: 'kittur', name: 'Kittur Rural Junction', district: 'Belagavi', lat: 15.5976, lng: 74.7937 },
  { id: 'gokak', name: 'Gokak Falls Hub', district: 'Belagavi', lat: 16.1681, lng: 74.8236 },
  { id: 'gadag', name: 'Gadag (Betageri)', district: 'Gadag', lat: 15.4319, lng: 75.6355 },
  { id: 'haveri', name: 'Haveri', district: 'Haveri', lat: 14.7967, lng: 75.4022 },
  { id: 'bagalkote', name: 'Bagalkote', district: 'Bagalkote', lat: 16.1817, lng: 75.6958 },
  { id: 'vijayapura', name: 'Vijayapura (Bijapur)', district: 'Vijayapura', lat: 16.8302, lng: 75.7100 },

  // Kalyana Karnataka (Hyderabad-Karnataka)
  { id: 'kalaburagi', name: 'Kalaburagi (Gulbarga)', district: 'Kalaburagi', lat: 17.3297, lng: 76.8343 },
  { id: 'ballari', name: 'Ballari (Bellary)', district: 'Ballari', lat: 15.1394, lng: 76.9214 },
  { id: 'hosapete', name: 'Hosapete (Hampi Gate)', district: 'Vijayanagara', lat: 15.2689, lng: 76.3909 },
  { id: 'koppal', name: 'Koppal', district: 'Koppal', lat: 15.3458, lng: 76.1554 },
  { id: 'raichur', name: 'Raichur', district: 'Raichur', lat: 16.2076, lng: 77.3463 },
  { id: 'bidar', name: 'Bidar', district: 'Bidar', lat: 17.9104, lng: 77.5199 },
  { id: 'yadgir', name: 'Yadgir', district: 'Yadgir', lat: 16.7699, lng: 77.1378 }
];

// Calculate Haversine road distance between 2 Karnataka coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;
  return Math.max(12, Math.round(directDistance * 1.28));
}

// Format a Date object into a readable time string (e.g. "10:25 PM")
export function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12
  const strMins = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${strMins} ${ampm}`;
}

// Generate realistic stops with times relative to a departure Date
function generateStopsForTime(src, dest, distanceKm, departureDate) {
  const numIntermediates = distanceKm > 100 ? 3 : distanceKm > 50 ? 2 : 1;
  const totalDurationMinutes = Math.max(25, Math.round((distanceKm / 45) * 60));
  const stops = [];

  // Origin stop
  stops.push({
    name: `${src.name} (Origin)`,
    time: formatTime(departureDate),
    km: 0,
    lat: src.lat,
    lng: src.lng
  });

  // Intermediate waypoints
  for (let i = 1; i <= numIntermediates; i++) {
    const fraction = i / (numIntermediates + 1);
    const interpLat = src.lat + (dest.lat - src.lat) * fraction + (Math.sin(i) * 0.02);
    const interpLng = src.lng + (dest.lng - src.lng) * fraction + (Math.cos(i) * 0.02);
    const interpKm = Math.round(distanceKm * fraction);

    // Nearby town name if close
    let stopName = `Corridor Checkpoint ${i}`;
    const nearby = KARNATAKA_LOCATIONS.find(loc => 
      loc.name !== src.name && 
      loc.name !== dest.name && 
      Math.abs(loc.lat - interpLat) < 0.35 && 
      Math.abs(loc.lng - interpLng) < 0.35
    );
    if (nearby) {
      stopName = `${nearby.name} Hub`;
    }

    const stopTime = new Date(departureDate.getTime() + (totalDurationMinutes * fraction * 60000));

    stops.push({
      name: stopName,
      time: formatTime(stopTime),
      km: interpKm,
      lat: interpLat,
      lng: interpLng
    });
  }

  // Destination stop
  const arrivalDate = new Date(departureDate.getTime() + (totalDurationMinutes * 60000));
  stops.push({
    name: `${dest.name} (Destination)`,
    time: formatTime(arrivalDate),
    km: distanceKm,
    lat: dest.lat,
    lng: dest.lng
  });

  return { stops, arrivalTime: formatTime(arrivalDate), totalDurationMinutes };
}

// Generate available buses dynamically scheduled around CURRENT REAL-WORLD TIME
export function generateBusesForRoute(srcName, destName, baseTime = new Date()) {
  const src = KARNATAKA_LOCATIONS.find(l => l.name.toLowerCase() === srcName.toLowerCase()) || KARNATAKA_LOCATIONS[0];
  const dest = KARNATAKA_LOCATIONS.find(l => l.name.toLowerCase() === destName.toLowerCase()) || KARNATAKA_LOCATIONS[1];

  const distanceKm = calculateDistance(src.lat, src.lng, dest.lat, dest.lng);
  const totalMinutes = Math.max(25, Math.round((distanceKm / 45) * 60));
  const hoursInt = Math.floor(totalMinutes / 60);
  const minsInt = totalMinutes % 60;
  const durationStr = `${hoursInt > 0 ? `${hoursInt}h ` : ''}${minsInt}m`;

  const baseFare = Math.max(35, Math.round(distanceKm * 1.15));

  // Determine Highway
  let highwayName = 'Karnataka State Highway';
  if (src.district.includes('Dakshina') || dest.district.includes('Dakshina')) {
    highwayName = 'NH-73 / SH-114 Western Ghats & Coastal Express';
  } else if (src.district.includes('Mysuru') || dest.district.includes('Mysuru')) {
    highwayName = 'NH-275 / State Highway 17 Expressway';
  } else if (src.district.includes('Belagavi') || dest.district.includes('Belagavi')) {
    highwayName = 'AH-47 / NH-48 Pune-Bengaluru Golden Corridor';
  } else if (src.district.includes('Shivamogga') || dest.district.includes('Shivamogga')) {
    highwayName = 'NH-69 / SH-57 Malnad Green Corridor';
  } else {
    highwayName = 'NH-50 / State Rural Highway Link';
  }

  // Bus Schedules relative to CURRENT TIME:
  // Bus 1: Departs in ~15-20 minutes (immediate upcoming departure)
  // Bus 2: Departs in ~45-55 minutes
  // Bus 3: Departs in ~90-110 minutes
  // Bus 4: Departs in ~160-180 minutes
  const schedules = [
    {
      minsFromNow: 16,
      name: 'KSRTC Grama Sarige (Express)',
      operator: `KSRTC Grameena Sarige (${src.district} Depot)`,
      type: 'Standard Rural Sarige (Non-AC)',
      seats: 12,
      totalSeats: 36,
      fare: baseFare,
      statusDesc: 'Departing Soon • Boarding at Bay #2'
    },
    {
      minsFromNow: 48,
      name: 'Suvarna Grameena Mini Coach',
      operator: 'Karnataka Rural Mobility Fleet',
      type: 'Force Rural Cruiser (18-Seater)',
      seats: 5,
      totalSeats: 18,
      fare: Math.round(baseFare * 1.1),
      statusDesc: 'On Schedule • 5 Seats Remaining'
    },
    {
      minsFromNow: 95,
      name: 'Rural Express Passenger Shuttle',
      operator: 'Local Taluk Co-op Transport',
      type: '32-Seater Starbus Rural Coach',
      seats: 21,
      totalSeats: 32,
      fare: Math.max(30, Math.round(baseFare * 0.95)),
      statusDesc: 'Scheduled Service • Advance Booking'
    },
    {
      minsFromNow: 160,
      name: 'KSRTC Night / Regional Rider',
      operator: `KSRTC Central Division`,
      type: 'Semi-Deluxe Rural Bus',
      seats: 28,
      totalSeats: 40,
      fare: baseFare,
      statusDesc: 'Open for Booking'
    }
  ];

  return schedules.map((item, idx) => {
    const departureDate = new Date(baseTime.getTime() + item.minsFromNow * 60000);
    const departureTimeStr = formatTime(departureDate);
    const { stops, arrivalTime } = generateStopsForTime(src, dest, distanceKm, departureDate);

    // Live position based on departure countdown:
    // If departing within 20 mins, bus is at or near origin terminal
    let liveCheckpoint = `${src.name} Terminal Bay #${idx + 1}`;
    let speed = 0;
    let etaMins = item.minsFromNow;
    let condition = item.statusDesc;

    if (item.minsFromNow <= 20) {
      liveCheckpoint = `${src.name} Main Bus Stand`;
      speed = 0;
      condition = `🟢 Departs in ${item.minsFromNow} mins • Boarding`;
    } else {
      liveCheckpoint = `Approaching from ${src.district} Depot Yard`;
      speed = 42;
      condition = `Scheduled • Departs in ${Math.floor(item.minsFromNow / 60) > 0 ? `${Math.floor(item.minsFromNow / 60)}h ` : ''}${item.minsFromNow % 60}m`;
    }

    return {
      id: `BUS-RT-${src.id}-${dest.id}-${idx + 1}`,
      busName: item.name,
      operatorName: item.operator,
      busType: item.type,
      vehicleRegNo: `KA-${Math.floor(10 + Math.random() * 60)}-F-${Math.floor(1000 + Math.random() * 9000)}`,
      source: src.name,
      destination: dest.name,
      departureTime: departureTimeStr,
      departureDateObj: departureDate,
      minsUntilDeparture: item.minsFromNow,
      arrivalTime,
      duration: durationStr,
      totalSeats: item.totalSeats,
      availableSeats: item.seats,
      fare: item.fare,
      liveStatus: {
        currentStop: liveCheckpoint,
        lat: src.lat,
        lng: src.lng,
        speedKm: speed,
        etaMins,
        condition,
        lastUpdated: 'Live Current Time'
      },
      optimalRoute: {
        totalDistanceKm: distanceKm,
        estimatedTime: durationStr,
        highway: highwayName,
        roadCondition: 'Smooth All-Weather Asphalt • Safe Rural Corridor',
        stops
      }
    };
  });
}
