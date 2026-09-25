import React, { createContext, useContext, useState, useEffect } from 'react';

export const translations = {
  en: {
    // Brand & App
    appName: 'Rural Link',
    appSubtitle: 'Logistics & Transit',
    appTagline: 'Smart Rural Transport and Logistic Optimisation',
    hackathonPrototype: 'Hackathon Prototype v1.0',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    
    // Auth
    registerTab: 'Register (Farmer / Operator)',
    loginTab: 'Login (Name & Password)',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    emailId: 'Email ID',
    password: 'Password',
    chooseRole: 'Choose Your Role',
    farmerRole: 'Farmer / Passenger (Krishi & Yatra)',
    farmerRoleDesc: 'Book bus seats, post harvest freight, and track mandis',
    operatorRole: 'Vehicle Operator (Buses / Trucks)',
    operatorRoleDesc: 'Provide transit services or farm cargo logistics',
    operatorType: 'Operator Service Category',
    travelsOperator: 'Travels Operator (Buses / Passenger Shuttles)',
    transportOperator: 'Transporter (Freight Trucks / Crop Cargo)',
    vehicleModelName: 'Vehicle Model & Name',
    vehicleRegNo: 'Vehicle Registration Number',
    seatingCapacity: 'Passenger Seating Capacity',
    loadingCapacity: 'Loading Capacity (Quintals / Tons)',
    settlementUpi: 'Settlement UPI ID (GPay / PhonePe / Paytm)',
    currentVillage: 'Current Village / Taluk (Karnataka Hub)',
    completeRegistration: 'Complete Registration & Open Dashboard',
    alreadyRegistered: 'Already registered? Login with Name',
    needAccount: 'Need to register a new account?',
    loginToRuralLink: 'Login to Rural Link',
    quickDemoAccounts: 'Quick Demo Login Accounts',
    farmerDemo: 'Ramesh Patel (Farmer / Passenger)',
    travelsDemo: 'Suresh Kumar (Travels Operator)',
    transportDemo: 'Balaji Transport Co. (Freight Truck)',
    demoNote: 'Click any role below to prefill demo credentials:',
    
    // Navigation
    home: 'Home',
    passengerDashboard: 'Passenger Dashboard',
    farmerLink: 'Farmer Link',
    travelsDashboard: 'Travels Dashboard',
    transporterDashboard: 'Transporter Dashboard',
    freight: 'Freight',
    operator: 'Operator',
    liveLoc: 'Live Loc',
    detectGps: 'Detect My Live GPS Location',
    detectingGps: 'Detecting GPS...',
    gpsDetected: 'Live GPS Detected ✓',
    coastalCorridors: 'Coastal & Malnad Corridors (Featured)',
    allHubs: 'All Karnataka Hubs',
    profile: 'Profile',
    edit: 'Edit',
    language: 'Language',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    switchLang: 'Language / ಭಾಷೆ',

    // Profile Modal
    profileDetails: 'Profile Details',
    farmerPassengerProfile: 'Farmer / Passenger Profile',
    operatorProfile: 'Operator Profile',
    preferredLanguage: 'Preferred Language',
    baseLocation: 'Base Location',
    editProfileDetails: 'Edit Profile Details',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    profileUpdated: 'Profile updated successfully!',

    // Dashboard Home
    namaste: 'Namaste',
    farmerWelcomeDesc: 'Search rural bus departures, track live vehicles, or pool farm freight to Karnataka Mandis.',
    travelsWelcomeDesc: 'Manage your passenger routes, assign available seats, and collect digital fares via UPI.',
    transporterWelcomeDesc: 'Optimize your cargo load capacity, eliminate empty return trips (backhaul), and receive direct freight bookings.',
    accountSummary: 'Account Summary',
    registeredVehicleInfo: 'Registered Vehicle & Settlement Information',
    activeFleet: 'Active Fleet',
    openPassengerDashboard: 'Open Passenger Dashboard',
    openFarmerLink: 'Open Farmer Link',
    openTravelsDashboard: 'Open Travels Dashboard',
    openTransporterDashboard: 'Open Transporter Dashboard',
    networkUpdates: 'Karnataka Rural Mobility Network Updates',
    allCorridorsOperational: 'All Corridors Operational',

    // Passenger Dashboard
    passengerPortalTitle: 'Rural Passenger Transit Dashboard',
    passengerPortalSubtitle: 'Find real-time rural shuttles, KSRTC feeder services, and village-to-town buses',
    availableBuses: 'Available Buses & Shuttles',
    searchBusesPlaceholder: 'Search by bus name, origin, destination or route...',
    bookSeat: 'Book Ticket',
    trackBus: 'Track Bus (Live GPS)',
    bookedDetails: 'My Booked Bus Tickets',
    cancelTicket: 'Cancel Booking',
    pickup: 'Pickup Point',
    drop: 'Destination Drop',
    fare: 'Fare',
    seatsAvailable: 'Seats Available',
    departureTime: 'Departure Time',
    cashOnBoarding: 'Cash on Boarding',
    payWithUpi: 'Pay via UPI',
    noBusesFound: 'No buses currently scheduled for this route.',
    routeMap: 'View Route Map',
    ticketConfirmed: 'Confirmed Ticket',

    // Farmer Link
    farmerPortalTitle: 'Farmer Link (Krishi Freight & APMC)',
    farmerPortalSubtitle: 'Eliminate middleman margins, pool farm produce, and book return-trip trucks directly to Mandis',
    postFreightRequest: 'Book Produce Transport / Request Freight',
    availableTrucks: 'Available Freight Trucks in Corridor',
    cropType: 'Crop / Harvest Produce',
    weightQuintals: 'Quantity / Weight (Quintals)',
    targetMandi: 'Target APMC Mandi Market',
    myBookings: 'My Active Freight Bookings',
    trackGoods: 'Track Goods Telemetry (Live)',
    cancelFreight: 'Cancel Freight Request',
    cashOnPickup: 'Cash on Pickup',
    sharedCapacity: 'Shared Vehicle (Cost Shared)',
    estimatedFare: 'Estimated Transport Fare',

    // Travels Dashboard
    travelsTitle: 'Travels Operator Route Dispatcher',
    createTripTask: 'Create & Publish New Trip Task',
    startingLocation: 'Starting Location (Origin)',
    endingLocation: 'Ending Location (Destination)',
    viaRoute: 'Via Route Corridor',
    systemDeclaredFare: 'System Declared Ticket Fare',
    totalSeats: 'Total Seats',
    availableSeats: 'Available Seats',
    publishTrip: 'Publish Trip to Passenger Dashboard',
    activePassengerBookings: 'Active Passenger Bookings',
    liveGpsStatus: 'Live Location & GPS Telemetry',

    // Transporter Dashboard
    transporterTitle: 'Transporter Freight Route & Load Manager',
    createFreightTask: 'Create & Publish Freight Route Task',
    availCapacity: 'Available Vehicle Capacity (Quintals)',
    totalCapacity: 'Total Capacity (Quintals)',
    ratePerQuintal: 'Freight Rate (₹ per Quintal)',
    allowedGoods: 'Allowed Agricultural Produce',
    enableSharing: 'Enable Multi-Farmer Capacity Sharing (Pro-Rata)',
    publishFreightTask: 'Publish Freight Task to Farmer Dashboard',
    incomingRequests: 'Incoming Farmer Load Requests',
    nearbyAlertTitle: 'Nearby Harvest Load Request in Your Corridor!',
    approveAndAccept: 'Approve & Accept Load',
    decline: 'Decline',
    trackFarmPickup: 'Track Farm Pickup (Navigate)',
    driverCheckpointArrived: 'Arrived at Farm (Loading)',
    driverCheckpointDepart: 'Depart to Mandi (In Transit)',
    callFarmer: 'Call Farmer',
    openGoogleMaps: 'Open Google Maps GPS Navigation',
    directUpiSettlement: 'Direct Transporter UPI ID',
  },
  kn: {
    // Brand & App
    appName: 'ರೂರಲ್ ಲಿಂಕ್',
    appSubtitle: 'ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಮತ್ತು ಸಾರಿಗೆ',
    appTagline: 'ಸ್ಮಾರ್ಟ್ ಗ್ರಾಮೀಣ ಸಾರಿಗೆ ಮತ್ತು ಕೃಷಿ ಸರಕು ನಿರ್ವಹಣೆ',
    hackathonPrototype: 'ಮಾದರಿ ಆವೃತ್ತಿ v1.0',
    logout: 'ಲಾಗ್‌ಔಟ್',
    login: 'ಲಾಗಿನ್',
    register: 'ನೋಂದಣಿ',
    
    // Auth
    registerTab: 'ನೋಂದಣಿ (ರೈತ / ವಾಹನ ನಿರ್ವಾಹಕ)',
    loginTab: 'ಲಾಗಿನ್ (ಹೆಸರು ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್)',
    fullName: 'ಪೂರ್ಣ ಹೆಸರು',
    phoneNumber: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    emailId: 'ಇಮೇಲ್ ವಿಳಾಸ',
    password: 'ಪಾಸ್‌ವರ್ಡ್',
    chooseRole: 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    farmerRole: 'ರೈತ / ಪ್ರಯಾಣಿಕ (ಕೃಷಿ ಮತ್ತು ಯಾತ್ರೆ)',
    farmerRoleDesc: 'ಬಸ್ ಆಸನಗಳನ್ನು ಬುಕ್ ಮಾಡಿ, ಬೆಳೆ ಸಾಗಾಟ ವಿನಂತಿ ಸಲ್ಲಿಸಿ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಪರಿಶೀಲಿಸಿ',
    operatorRole: 'ವಾಹನ ನಿರ್ವಾಹಕ (ಬಸ್ಸುಗಳು / ಸರಕು ಲಾರಿ)',
    operatorRoleDesc: 'ಪ್ರಯಾಣಿಕರ ಸಾರಿಗೆ ಅಥವಾ ಕೃಷಿ ಸರಕು ಸೇವೆಗಳನ್ನು ಒದಗಿಸಿ',
    operatorType: 'ನಿರ್ವಾಹಕ ಸೇವಾ ವಿಭಾಗ',
    travelsOperator: 'ಟ್ರಾವೆಲ್ಸ್ ನಿರ್ವಾಹಕ (ಪ್ರಯಾಣಿಕರ ಬಸ್ಸುಗಳು)',
    transportOperator: 'ಸರಕು ಸಾಗಾಟಗಾರ (ಲಾರಿ / ಪಿಕಪ್ ಟ್ರಕ್)',
    vehicleModelName: 'ವಾಹನದ ಮಾದರಿ ಮತ್ತು ಹೆಸರು',
    vehicleRegNo: 'ವಾಹನ ನೋಂದಣಿ ಸಂಖ್ಯೆ',
    seatingCapacity: 'ಪ್ರಯಾಣಿಕರ ಆಸನ ಸಾಮರ್ಥ್ಯ',
    loadingCapacity: 'ಹೊರುವ ಸಾಮರ್ಥ್ಯ (ಕ್ವಿಂಟಾಲ್ / ಟನ್)',
    settlementUpi: 'ಪಾವತಿ ಯುಪಿಐ ಐಡಿ (GPay / PhonePe / Paytm)',
    currentVillage: 'ಪ್ರಸ್ತುತ ಗ್ರಾಮ / ತಾಲೂಕು (ಕರ್ನಾಟಕ ಕೇಂದ್ರ)',
    completeRegistration: 'ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
    alreadyRegistered: 'ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆಯೇ? ಹೆಸರು ಬಳಸಿ ಲಾಗಿನ್ ಮಾಡಿ',
    needAccount: 'ಹೊಸ ಖಾತೆ ನೋಂದಾಯಿಸಬೇಕೇ?',
    loginToRuralLink: 'ರೂರಲ್ ಲಿಂಕ್‌ಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
    quickDemoAccounts: 'ತ್ವರಿತ ಡೆಮೊ ಲಾಗಿನ್ ಖಾತೆಗಳು',
    farmerDemo: 'ರಮೇಶ್ ಪಟೇಲ್ (ರೈತ / ಪ್ರಯಾಣಿಕ)',
    travelsDemo: 'ಸುರೇಶ್ ಕುಮಾರ್ (ಟ್ರಾವೆಲ್ಸ್ ನಿರ್ವಾಹಕ)',
    transportDemo: 'ಬಾಲಾಜಿ ಟ್ರಾನ್ಸ್‌ಪೋರ್ಟ್ (ಸರಕು ಲಾರಿ)',
    demoNote: 'ಡೆಮೊ ರುಜುವಾತುಗಳನ್ನು ಭರ್ತಿ ಮಾಡಲು ಕೆಳಗಿನ ಯಾವುದೇ ಪಾತ್ರವನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ:',

    // Navigation
    home: 'ಮುಖಪುಟ',
    passengerDashboard: 'ಪ್ರಯಾಣಿಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    farmerLink: 'ರೈತ ಲಿಂಕ್',
    travelsDashboard: 'ಟ್ರಾವೆಲ್ಸ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    transporterDashboard: 'ಸರಕು ವಾಹನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    freight: 'ಸರಕು',
    operator: 'ನಿರ್ವಾಹಕ',
    liveLoc: 'ಲೈವ್ ಸ್ಥಳ',
    detectGps: 'ನನ್ನ ಲೈವ್ ಜಿಪಿಎಸ್ ಸ್ಥಳ ಪತ್ತೆಹಚ್ಚಿ',
    detectingGps: 'ಜಿಪಿಎಸ್ ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...',
    gpsDetected: 'ಲೈವ್ ಜಿಪಿಎಸ್ ಪತ್ತೆಯಾಗಿದೆ ✓',
    coastalCorridors: 'ಕರಾವಳಿ ಮತ್ತು ಮಲೆನಾಡು ಕಾರಿಡಾರ್‌ಗಳು (ಮುಖ್ಯ)',
    allHubs: 'ಎಲ್ಲಾ ಕರ್ನಾಟಕ ಕೇಂದ್ರಗಳು',
    profile: 'ಪ್ರೊಫೈಲ್',
    edit: 'ಸಂಪಾದಿಸಿ',
    language: 'ಭಾಷೆ',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    switchLang: 'ಭಾಷೆ / Language',

    // Profile Modal
    profileDetails: 'ಪ್ರೊಫೈಲ್ ವಿವರಗಳು',
    farmerPassengerProfile: 'ರೈತ / ಪ್ರಯಾಣಿಕ ಪ್ರೊಫೈಲ್',
    operatorProfile: 'ನಿರ್ವಾಹಕರ ಪ್ರೊಫೈಲ್',
    preferredLanguage: 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    baseLocation: 'ಮೂಲ ಸ್ಥಳ',
    editProfileDetails: 'ಪ್ರೊಫೈಲ್ ವಿವರಗಳನ್ನು ಸಂಪಾದಿಸಿ',
    saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
    cancel: 'ರದ್ದು',
    profileUpdated: 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',

    // Dashboard Home
    namaste: 'ನಮಸ್ಕಾರ',
    farmerWelcomeDesc: 'ಗ್ರಾಮೀಣ ಬಸ್ಸುಗಳನ್ನು ಹುಡುಕಿ, ವಾಹನಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ ಅಥವಾ ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ ಮಂಡಿಗಳಿಗೆ ಕೃಷಿ ಸರಕು ಸಾಗಾಟ ಮಾಡಿ.',
    travelsWelcomeDesc: 'ನಿಮ್ಮ ಪ್ರಯಾಣಿಕರ ಮಾರ್ಗಗಳನ್ನು ನಿರ್ವಹಿಸಿ, ಆಸನಗಳನ್ನು ನಿಯೋಜಿಸಿ ಮತ್ತು ಯುಪಿಐ ಮೂಲಕ ಟಿಕೆಟ್ ಹಣ ಸಂಗ್ರಹಿಸಿ.',
    transporterWelcomeDesc: 'ನಿಮ್ಮ ವಾಹನದ ಹೊರುವ ಸಾಮರ್ಥ್ಯವನ್ನು ಗರಿಷ್ಠಗೊಳಿಸಿ, ಖಾಲಿ ವಾಪಸಾತಿಯನ್ನು ತಪ್ಪಿಸಿ ಮತ್ತು ನೇರ ಬುಕಿಂಗ್ ಪಡೆಯಿರಿ.',
    accountSummary: 'ಖಾತೆ ಸಾರಾಂಶ',
    registeredVehicleInfo: 'ನೋಂದಾಯಿತ ವಾಹನ ಮತ್ತು ವಸಾಹತು ಮಾಹಿತಿ',
    activeFleet: 'ಸಕ್ರಿಯ ವಾಹನ',
    openPassengerDashboard: 'ಪ್ರಯಾಣಿಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
    openFarmerLink: 'ರೈತ ಲಿಂಕ್ ತೆರೆಯಿರಿ',
    openTravelsDashboard: 'ಟ್ರಾವೆಲ್ಸ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
    openTransporterDashboard: 'ಸರಕು ವಾಹನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ',
    networkUpdates: 'ಕರ್ನಾಟಕ ಗ್ರಾಮೀಣ ಸಾರಿಗೆ ನೆಟ್‌ವರ್ಕ್ ನವೀಕರಣಗಳು',
    allCorridorsOperational: 'ಎಲ್ಲಾ ಕಾರಿಡಾರ್‌ಗಳು ಚಾಲ್ತಿಯಲ್ಲಿವೆ',

    // Passenger Dashboard
    passengerPortalTitle: 'ಗ್ರಾಮೀಣ ಪ್ರಯಾಣಿಕರ ಸಾರಿಗೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    passengerPortalSubtitle: 'ನೈಜ ಸಮಯದ ಗ್ರಾಮೀಣ ಶಟಲ್, ಕೆಎಸ್ಆರ್ಟಿಸಿ ಸಂಪರ್ಕ ಬಸ್ಸುಗಳು ಮತ್ತು ಹಳ್ಳಿಯಿಂದ ಪಟ್ಟಣದ ವಾಹನಗಳನ್ನು ಹುಡುಕಿ',
    availableBuses: 'ಲಭ್ಯವಿರುವ ಗ್ರಾಮೀಣ ಬಸ್ಸುಗಳು',
    searchBusesPlaceholder: 'ಬಸ್ ಹೆಸರು, ಪ್ರಾರಂಭಿಕ ಸ್ಥಳ, ಗಮ್ಯಸ್ಥಾನ ಅಥವಾ ಮಾರ್ಗದ ಮೂಲಕ ಹುಡುಕಿ...',
    bookSeat: 'ಟಿಕೆಟ್ ಬುಕ್ ಮಾಡಿ',
    trackBus: 'ಬಸ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ (ಲೈವ್ ಜಿಪಿಎಸ್)',
    bookedDetails: 'ನನ್ನ ಬುಕ್ ಮಾಡಿದ ಬಸ್ ಟಿಕೆಟ್‌ಗಳು',
    cancelTicket: 'ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಿ',
    pickup: 'ಹತ್ತುವ ಸ್ಥಳ',
    drop: 'ತಲುಪುವ ಸ್ಥಳ',
    fare: 'ದರ',
    seatsAvailable: 'ಲಭ್ಯವಿರುವ ಆಸನಗಳು',
    departureTime: 'ಹೊರಡುವ ಸಮಯ',
    cashOnBoarding: 'ಹತ್ತುವಾಗ ನಗದು',
    payWithUpi: 'ಯುಪಿಐ ಮೂಲಕ ಪಾವತಿಸಿ',
    noBusesFound: 'ಈ ಮಾರ್ಗದಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಬಸ್ಸುಗಳು ನಿಗದಿಯಾಗಿಲ್ಲ.',
    routeMap: 'ಮಾರ್ಗದ ನಕ್ಷೆ ವೀಕ್ಷಿಸಿ',
    ticketConfirmed: 'ದೃಢಪಡಿಸಿದ ಟಿಕೆಟ್',

    // Farmer Link
    farmerPortalTitle: 'ರೈತ ಲಿಂಕ್ (ಕೃಷಿ ಸರಕು ಮತ್ತು ಮಂಡಿ)',
    farmerPortalSubtitle: 'ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ಕೃಷಿ ಉತ್ಪನ್ನಗಳನ್ನು ಮಾರುಕಟ್ಟೆಗೆ ಸಾಗಿಸಿ ಮತ್ತು ಹಂಚಿಕೆಯ ಲಾರಿಗಳನ್ನು ಬುಕ್ ಮಾಡಿ',
    postFreightRequest: 'ಬೆಳೆ ಸಾಗಾಟ ವಿನಂತಿ ಸಲ್ಲಿಸಿ / ವಾಹನ ಬುಕ್ ಮಾಡಿ',
    availableTrucks: 'ಲಭ್ಯವಿರುವ ಸರಕು ವಾಹನಗಳು',
    cropType: 'ಕೃಷಿ ಬೆಳೆ / ಉತ್ಪನ್ನ',
    weightQuintals: 'ತೂಕ (ಕ್ವಿಂಟಾಲ್‌ನಲ್ಲಿ)',
    targetMandi: 'ಗಮ್ಯಸ್ಥಾನ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ',
    myBookings: 'ನನ್ನ ಸಕ್ರಿಯ ಸರಕು ಬುಕಿಂಗ್‌ಗಳು',
    trackGoods: 'ಸರಕು ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್',
    cancelFreight: 'ಸರಕು ಬುಕಿಂಗ್ ರದ್ದುಗೊಳಿಸಿ',
    cashOnPickup: 'ಪಿಕಪ್ ಸಮಯದಲ್ಲಿ ನಗದು',
    sharedCapacity: 'ಹಂಚಿಕೆಯ ವಾಹನ (ವೆಚ್ಚ ಹಂಚಿಕೆ)',
    estimatedFare: 'ಅಂದಾಜು ಸಾಗಾಟ ದರ',

    // Travels Dashboard
    travelsTitle: 'ಟ್ರಾವೆಲ್ಸ್ ನಿರ್ವಾಹಕ ಮಾರ್ಗ ನಿರ್ವಹಣೆ',
    createTripTask: 'ಹೊಸ ಪ್ರವಾಸ ಕಾರ್ಯವನ್ನು ರಚಿಸಿ ಮತ್ತು ಪ್ರಕಟಿಸಿ',
    startingLocation: 'ಪ್ರಾರಂಭಿಕ ಸ್ಥಳ (ಮೂಲ)',
    endingLocation: 'ಅಂತಿಮ ಸ್ಥಳ (ಗಮ್ಯಸ್ಥಾನ)',
    viaRoute: 'ಮಾರ್ಗ ಕಾರಿಡಾರ್',
    systemDeclaredFare: 'ವ್ಯವಸ್ಥೆ ನಿಗದಿಪಡಿಸಿದ ಟಿಕೆಟ್ ದರ',
    totalSeats: 'ಒಟ್ಟು ಆಸನಗಳು',
    availableSeats: 'ಲಭ್ಯವಿರುವ ಆಸನಗಳು',
    publishTrip: 'ಪ್ರಯಾಣಿಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಪ್ರಕಟಿಸಿ',
    activePassengerBookings: 'ಸಕ್ರಿಯ ಪ್ರಯಾಣಿಕರ ಬುಕಿಂಗ್‌ಗಳು',
    liveGpsStatus: 'ಲೈವ್ ಸ್ಥಳ ಮತ್ತು ಜಿಪಿಎಸ್ ಸ್ಥಿತಿ',

    // Transporter Dashboard
    transporterTitle: 'ಸರಕು ವಾಹನ ಮಾರ್ಗ ಮತ್ತು ಲೋಡ್ ನಿರ್ವಹಣೆ',
    createFreightTask: 'ಸರಕು ಸಾಗಾಟ ಮಾರ್ಗ ಕಾರ್ಯವನ್ನು ರಚಿಸಿ ಮತ್ತು ಪ್ರಕಟಿಸಿ',
    availCapacity: 'ಲಭ್ಯವಿರುವ ವಾಹನ ಸಾಮರ್ಥ್ಯ (ಕ್ವಿಂಟಾಲ್)',
    totalCapacity: 'ಒಟ್ಟು ಸಾಮರ್ಥ್ಯ (ಕ್ವಿಂಟಾಲ್)',
    ratePerQuintal: 'ಸಾಗಾಟ ದರ (₹ ಪ್ರತಿ ಕ್ವಿಂಟಾಲ್‌ಗೆ)',
    allowedGoods: 'ಅನುಮತಿಸಲಾದ ಕೃಷಿ ಸರಕುಗಳು',
    enableSharing: 'ಬಹು-ರೈತರ ಸಾಮರ್ಥ್ಯ ಹಂಚಿಕೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ',
    publishFreightTask: 'ರೈತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸರಕು ಕಾರ್ಯವನ್ನು ಪ್ರಕಟಿಸಿ',
    incomingRequests: 'ಒಳಬರುವ ರೈತರ ಸರಕು ವಿನಂತಿಗಳು',
    nearbyAlertTitle: 'ನಿಮ್ಮ ಮಾರ್ಗದಲ್ಲಿ ಹೊಸ ಬೆಳೆ ಸರಕು ಸಾಗಾಟ ವಿನಂತಿ ಬಂದಿದೆ!',
    approveAndAccept: 'ಅನುಮೋದಿಸಿ ಮತ್ತು ಲೋಡ್ ಸ್ವೀಕರಿಸಿ',
    decline: 'ತಿರಸ್ಕರಿಸಿ',
    trackFarmPickup: 'ಫಾರ್ಮ್ ಪಿಕಪ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ (ಮಾರ್ಗ)',
    driverCheckpointArrived: 'ಫಾರ್ಮ್ ತಲುಪಿದೆ (ಲೋಡಿಂಗ್)',
    driverCheckpointDepart: 'ಮಾರುಕಟ್ಟೆಗೆ ಪ್ರಯಾಣ (ಸಾಗಾಟದಲ್ಲಿದೆ)',
    callFarmer: 'ರೈತರಿಗೆ ಕರೆ ಮಾಡಿ',
    openGoogleMaps: 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್ ಜಿಪಿಎಸ್ ನ್ಯಾವಿಗೇಷನ್ ತೆರೆಯಿರಿ',
    directUpiSettlement: 'ವಸಾಹತು ಯುಪಿಐ ಐಡಿ',
  }
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }) {
  // Default to English as requested ("beginning of login its in english")
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('smart_rural_lang') || 'en';
  });

  const setLanguage = (lang) => {
    const valid = lang === 'kn' ? 'kn' : 'en';
    setLanguageState(valid);
    localStorage.setItem('smart_rural_lang', valid);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'kn' : 'en');
  };

  const t = (key, fallback = '') => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
