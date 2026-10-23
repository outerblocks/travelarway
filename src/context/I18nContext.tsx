import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Language = 'en' | 'sw';

const STORAGE_KEY = 'travelar_lang';

type TranslationKey =
  | 'dashboard'
  | 'overview'
  | 'profile'
  | 'allBookings'
  | 'busBookings'
  | 'ferryBookings'
  | 'flightBookings'
  | 'trainBookings'
  | 'stayBookings'
  | 'experienceBookings'
  | 'settings'
  | 'signOut'
  | 'welcomeBack'
  | 'upcomingTrips'
  | 'completedTrips'
  | 'totalSpent'
  | 'travelModes'
  | 'tripHistory'
  | 'nextTrip'
  | 'noTripsCategory'
  | 'bookNextTrip'
  | 'all'
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'trip'
  | 'trips'
  | 'passenger'
  | 'passengers'
  | 'ref'
  | 'daysAway'
  | 'dayAway'
  | 'today'
  | 'name'
  | 'email'
  | 'signInMethod'
  | 'emailPassword'
  | 'google'
  | 'apple'
  | 'quickActions'
  | 'manageBooking'
  | 'searchNewTrips'
  | 'bus'
  | 'ferry'
  | 'flights'
  | 'train'
  | 'stays'
  | 'experiences'
  | 'bookings'
  | 'recentBookings'
  | 'viewAll'
  | 'language'
  | 'english'
  | 'swahili'
  | 'operatorDashboard'
  | 'selectOperator'
  | 'schedules'
  | 'fleet'
  | 'manifest'
  | 'revenue'
  | 'totalBookings'
  | 'confirmedBookings'
  | 'pendingBookings'
  | 'cancelledBookings'
  | 'totalRevenue'
  | 'activeTrips'
  | 'activeSailings'
  | 'availableSeats'
  | 'totalCapacity'
  | 'capacityUtil'
  | 'vessel'
  | 'vesselName'
  | 'departurePort'
  | 'arrivalPort'
  | 'departureTime'
  | 'arrivalTime'
  | 'busModel'
  | 'registrationNo'
  | 'busClass'
  | 'route'
  | 'date'
  | 'customer'
  | 'phone'
  | 'amount'
  | 'status'
  | 'confirmed'
  | 'pending'
  | 'refunded'
  | 'noBookings'
  | 'noSchedules'
  | 'operatorPortal'
  | 'busOperators'
  | 'ferryOperators'
  | 'searchOperator'
  | 'mgmtConsole'
  | 'fleetManagement'
  | 'vesselManagement'
  | 'scheduleManagement'
  | 'bookingManagement'
  | 'analytics'
  | 'addTrip'
  | 'addSailing'
  | 'addVehicle'
  | 'addVessel'
  | 'editSchedule'
  | 'vehicleStatus'
  | 'vesselStatus'
  | 'lastService'
  | 'lastInspection'
  | 'mileage'
  | 'yearBuilt'
  | 'assignedTo'
  | 'unassigned'
  | 'active'
  | 'maintenance'
  | 'retired'
  | 'dryDock'
  | 'scheduled'
  | 'boarding'
  | 'departed'
  | 'completed'
  | 'bookedSeats'
  | 'totalSeats'
  | 'seatNumbers'
  | 'classBooked'
  | 'bookedAt'
  | 'revenueTrend'
  | 'dailyRevenue'
  | 'last14Days'
  | 'backToSite'
  | 'mgmtOverview'
  | 'totalVehicles'
  | 'totalVessels'
  | 'activeVehicles'
  | 'inMaintenance'
  | 'occupancyRate'
  | 'avgFare'
  | 'confirmAction'
  | 'cancelBooking'
  | 'refundBooking'
  | 'viewDetails'
  | 'searchBookings'
  | 'allStatuses'
  | 'noVehicles'
  | 'noVessels'
  | 'operations';

type TranslationMap = Record<TranslationKey, string>;

const en: TranslationMap = {
  dashboard: 'Dashboard',
  overview: 'Overview',
  profile: 'Profile',
  allBookings: 'All Bookings',
  busBookings: 'Bus',
  ferryBookings: 'Ferry',
  flightBookings: 'Flights',
  trainBookings: 'Train',
  stayBookings: 'Stays',
  experienceBookings: 'Experiences',
  settings: 'Settings',
  signOut: 'Sign Out',
  welcomeBack: 'Welcome back',
  upcomingTrips: 'Upcoming trips',
  completedTrips: 'Completed',
  totalSpent: 'Total spent',
  travelModes: 'Travel modes',
  tripHistory: 'Trip history',
  nextTrip: 'Next trip',
  noTripsCategory: 'No trips in this category.',
  bookNextTrip: 'Book your next trip',
  all: 'All',
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  trip: 'trip',
  trips: 'trips',
  passenger: 'passenger',
  passengers: 'passengers',
  ref: 'Ref',
  daysAway: 'days away',
  dayAway: 'day away',
  today: 'Today',
  name: 'Name',
  email: 'Email',
  signInMethod: 'Sign-in method',
  emailPassword: 'Email & Password',
  google: 'Google',
  apple: 'Apple',
  quickActions: 'Quick actions',
  manageBooking: 'Manage a booking',
  searchNewTrips: 'Search new trips',
  bus: 'Bus',
  ferry: 'Ferry',
  flights: 'Flights',
  train: 'Train',
  stays: 'Stays',
  experiences: 'Experiences',
  bookings: 'Bookings',
  recentBookings: 'Recent bookings',
  viewAll: 'View all',
  language: 'Language',
  english: 'English',
  swahili: 'Swahili',
  operatorDashboard: 'Operator Dashboard',
  selectOperator: 'Select Operator',
  schedules: 'Schedules',
  fleet: 'Fleet',
  manifest: 'Booking Manifest',
  revenue: 'Revenue',
  totalBookings: 'Total bookings',
  confirmedBookings: 'Confirmed',
  pendingBookings: 'Pending',
  cancelledBookings: 'Cancelled',
  totalRevenue: 'Total revenue',
  activeTrips: 'Active trips',
  activeSailings: 'Active sailings',
  availableSeats: 'Available seats',
  totalCapacity: 'Total capacity',
  capacityUtil: 'Capacity utilisation',
  vessel: 'Vessel',
  vesselName: 'Vessel name',
  departurePort: 'Departure port',
  arrivalPort: 'Arrival port',
  departureTime: 'Departure',
  arrivalTime: 'Arrival',
  busModel: 'Bus model',
  registrationNo: 'Reg. number',
  busClass: 'Class',
  route: 'Route',
  date: 'Date',
  customer: 'Customer',
  phone: 'Phone',
  amount: 'Amount',
  status: 'Status',
  confirmed: 'Confirmed',
  pending: 'Pending',
  refunded: 'Refunded',
  noBookings: 'No bookings found.',
  noSchedules: 'No schedules configured.',
  operatorPortal: 'Operator Portal',
  busOperators: 'Bus Operators',
  ferryOperators: 'Ferry Operators',
  searchOperator: 'Search operator...',
  mgmtConsole: 'Management Console',
  fleetManagement: 'Fleet Management',
  vesselManagement: 'Vessel Management',
  scheduleManagement: 'Schedule Management',
  bookingManagement: 'Booking Management',
  analytics: 'Analytics',
  addTrip: 'Add Trip',
  addSailing: 'Add Sailing',
  addVehicle: 'Add Vehicle',
  addVessel: 'Add Vessel',
  editSchedule: 'Edit Schedule',
  vehicleStatus: 'Vehicle Status',
  vesselStatus: 'Vessel Status',
  lastService: 'Last Service',
  lastInspection: 'Last Inspection',
  mileage: 'Mileage (km)',
  yearBuilt: 'Year Built',
  assignedTo: 'Assigned To',
  unassigned: 'Unassigned',
  active: 'Active',
  maintenance: 'In Maintenance',
  retired: 'Retired',
  dryDock: 'Dry Dock',
  scheduled: 'Scheduled',
  boarding: 'Boarding',
  departed: 'Departed',
  bookedSeats: 'Booked',
  totalSeats: 'Total Seats',
  seatNumbers: 'Seats',
  classBooked: 'Class',
  bookedAt: 'Booked At',
  revenueTrend: 'Revenue Trend',
  dailyRevenue: 'Daily Revenue',
  last14Days: 'Last 14 days',
  backToSite: 'Back to Site',
  mgmtOverview: 'Operations Overview',
  totalVehicles: 'Total Vehicles',
  totalVessels: 'Total Vessels',
  activeVehicles: 'Active Vehicles',
  inMaintenance: 'In Maintenance',
  occupancyRate: 'Occupancy Rate',
  avgFare: 'Avg. Fare',
  confirmAction: 'Confirm',
  cancelBooking: 'Cancel Booking',
  refundBooking: 'Refund Booking',
  viewDetails: 'View Details',
  searchBookings: 'Search bookings...',
  allStatuses: 'All Statuses',
  noVehicles: 'No vehicles in fleet.',
  noVessels: 'No vessels registered.',
  operations: 'Operations',
};

const sw: TranslationMap = {
  dashboard: 'Dashibodi',
  overview: 'Muhtasari',
  profile: 'Wasifu',
  allBookings: 'Mahudhurio Yote',
  busBookings: 'Basi',
  ferryBookings: 'Feri',
  flightBookings: 'Ndege',
  trainBookings: 'Treni',
  stayBookings: 'Malazi',
  experienceBookings: 'Matukio',
  settings: 'Mipangilio',
  signOut: 'Toka',
  welcomeBack: 'Karibu tena',
  upcomingTrips: 'Safari zinazokuja',
  completedTrips: 'Zilizokamilika',
  totalSpent: 'Jumla iliyotumika',
  travelModes: 'Aina za usafiri',
  tripHistory: 'Historia ya safari',
  nextTrip: 'Safari inayofuata',
  noTripsCategory: 'Hakuna safari katika kategoria hii.',
  bookNextTrip: 'Weka nafasi ya safari inayofuata',
  all: 'Zote',
  upcoming: 'Zinazokuja',
  completed: 'Zilizokamilika',
  cancelled: 'Zilizokatishwa',
  trip: 'safari',
  trips: 'safari',
  passenger: 'abiria',
  passengers: 'abiria',
  ref: 'Ref',
  daysAway: 'siku zilizobaki',
  dayAway: 'siku iliyobaki',
  today: 'Leo',
  name: 'Jina',
  email: 'Barua pepe',
  signInMethod: 'Njia ya kuingia',
  emailPassword: 'Barua pepe na Nenosiri',
  google: 'Google',
  apple: 'Apple',
  quickActions: 'Vitendo vya haraka',
  manageBooking: 'Dhibiti mahudhurio',
  searchNewTrips: 'Tafuta safari mpya',
  bus: 'Basi',
  ferry: 'Feri',
  flights: 'Ndege',
  train: 'Treni',
  stays: 'Malazi',
  experiences: 'Matukio',
  bookings: 'Mahudhurio',
  recentBookings: 'Mahudhurio ya hivi karibuni',
  viewAll: 'Tazama zote',
  language: 'Lugha',
  english: 'Kiingereza',
  swahili: 'Kiswahili',
  operatorDashboard: 'Dashibodi ya Mwendeshaji',
  selectOperator: 'Chagua Mwendeshaji',
  schedules: 'Ratiba',
  fleet: 'Gari',
  manifest: 'Orodha ya Abiria',
  revenue: 'Mapato',
  totalBookings: 'Mahudhurio yote',
  confirmedBookings: 'Yamethibitishwa',
  pendingBookings: 'Yanasubiri',
  cancelledBookings: 'Yamekatishwa',
  totalRevenue: 'Mapato yote',
  activeTrips: 'Safari zinazoendelea',
  activeSailings: 'Safari za feri zinazoendelea',
  availableSeats: 'Viti vilivyobaki',
  totalCapacity: 'Uwezo wote',
  capacityUtil: 'Matumizi ya uwezo',
  vessel: 'Chombo',
  vesselName: 'Jina la chombo',
  departurePort: 'Bandari ya kwondo',
  arrivalPort: 'Bandari ya kufika',
  departureTime: 'Kuondoka',
  arrivalTime: 'Kufika',
  busModel: 'Aina ya basi',
  registrationNo: 'Namba ya usajili',
  busClass: 'Daraja',
  route: 'Njia',
  date: 'Tarehe',
  customer: 'Mteja',
  phone: 'Simu',
  amount: 'Kiasi',
  status: 'Hali',
  confirmed: 'Imethibitishwa',
  pending: 'Inasubiri',
  refunded: 'Imerudishiwa',
  noBookings: 'Hakuna mahudhurio yaliyopatikana.',
  noSchedules: 'Hakuna ratiba zilizowekwa.',
  operatorPortal: 'Lango la Mwendeshaji',
  busOperators: 'Wendeshaji wa Basi',
  ferryOperators: 'Wendeshaji wa Feri',
  searchOperator: 'Tafuta mwendeshaji...',
  mgmtConsole: 'Kituo cha Usimamizi',
  fleetManagement: 'Usimamizi wa Magari',
  vesselManagement: 'Usimamizi wa Vombo',
  scheduleManagement: 'Usimamizi wa Ratiba',
  bookingManagement: 'Usimamizi wa Mahudhurio',
  analytics: 'Uchambuzi',
  addTrip: 'Ongeza Safari',
  addSailing: 'Ongeza Safari ya Feri',
  addVehicle: 'Ongeza Gari',
  addVessel: 'Ongeza Chombo',
  editSchedule: 'Hariri Ratiba',
  vehicleStatus: 'Hali ya Gari',
  vesselStatus: 'Hali ya Chombo',
  lastService: 'Huduma ya Mwisho',
  lastInspection: 'Ukaguzi wa Mwisho',
  mileage: 'Kilomita',
  yearBuilt: 'Mwaka wa Ujenzi',
  assignedTo: 'Imekabidhiwa',
  unassigned: 'Haijakabidhiwa',
  active: 'Inafanya Kazi',
  maintenance: 'Inarekebishwa',
  retired: 'Imestaafu',
  dryDock: 'Ku Dry Dock',
  scheduled: 'Imepangwa',
  boarding: 'Wapandaji',
  departed: 'Imeondoka',
  bookedSeats: 'Yaliyotolewa',
  totalSeats: 'Viti Vyote',
  seatNumbers: 'Viti',
  classBooked: 'Daraja',
  bookedAt: 'Imetolewa',
  revenueTrend: 'Mwelekeo wa Mapato',
  dailyRevenue: 'Mapato ya Kila Siku',
  last14Days: 'Siku 14 zilizopita',
  backToSite: 'Rudi kwenye Tovuti',
  mgmtOverview: 'Muhtasari wa Shughuli',
  totalVehicles: 'Magari Yote',
  totalVessels: 'Vombo Vyote',
  activeVehicles: 'Magari Yanayofanya Kazi',
  inMaintenance: 'Yanarekebishwa',
  occupancyRate: 'Kiwango cha Ujazo',
  avgFare: 'Nafasi Wastani',
  confirmAction: 'Thibitisha',
  cancelBooking: 'Katisha Mahudhurio',
  refundBooking: 'Rudisha Pesa',
  viewDetails: 'Tazama Maelezo',
  searchBookings: 'Tafuta mahudhurio...',
  allStatuses: 'Hali Zote',
  noVehicles: 'Hakuna magari.',
  noVessels: 'Hakuna vombo vilivyosajiliwa.',
  operations: 'Shughuli',
};

const TRANSLATIONS: Record<Language, TranslationMap> = { en, sw };

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function loadLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'sw') return stored;
  } catch {
    // ignore
  }
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => loadLang());

  const setLang = useCallback((newLang: Language) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLangState(newLang);
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return TRANSLATIONS[lang][key] ?? key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { TranslationKey };
