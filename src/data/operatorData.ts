import type { BusTrip, FerrySailing } from '@/types';

export interface OperatorBooking {
  id: string;
  reference: string;
  serviceId: string;
  route: string;
  date: string;
  passengers: number;
  amount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'refunded';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  seatNumbers: string[];
  classBooked?: string;
  bookedAt: string;
}

export interface BusVehicle {
  id: string;
  registrationNumber: string;
  model: string;
  class: string;
  totalSeats: number;
  status: 'active' | 'maintenance' | 'retired';
  lastService: string;
  mileage: number;
  assignedTripId: string | null;
}

export interface FerryVessel {
  id: string;
  name: string;
  totalCapacity: number;
  status: 'active' | 'maintenance' | 'dry_dock';
  lastInspection: string;
  yearBuilt: number;
  assignedSailingId: string | null;
}

export interface ScheduleItem {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  duration: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'completed' | 'cancelled';
  bookedSeats: number;
  totalSeats: number;
  fare: number;
  currency: string;
}

export interface RevenueDay {
  date: string;
  revenue: number;
  bookings: number;
}

export interface BusOperatorData {
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
  totalTrips: number;
  activeTrips: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  currency: string;
  trips: BusTrip[];
  bookings: OperatorBooking[];
  fleet: BusVehicle[];
  schedules: ScheduleItem[];
  revenueHistory: RevenueDay[];
}

export interface FerryOperatorData {
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
  totalSailings: number;
  activeSailings: number;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  currency: string;
  sailings: FerrySailing[];
  bookings: OperatorBooking[];
  vessels: FerryVessel[];
  schedules: ScheduleItem[];
  revenueHistory: RevenueDay[];
}

const NAMES = ['John Mwangi', 'Asha Hassan', 'David Otieno', 'Fatuma Said', 'James Kalu', 'Neema Joseph', 'Peter Mbogo', 'Sarah Chau', 'Joseph Lema', 'Grace Mushi'];
const EMAILS = ['john.m@gmail.com', 'asha.h@gmail.com', 'david.o@gmail.com', 'fatuma.s@gmail.com', 'james.k@gmail.com', 'neema.j@gmail.com', 'peter.m@gmail.com', 'sarah.c@gmail.com', 'joseph.l@gmail.com', 'grace.m@gmail.com'];
const STATUSES: OperatorBooking['status'][] = ['confirmed', 'confirmed', 'confirmed', 'confirmed', 'pending', 'cancelled', 'confirmed', 'pending', 'confirmed', 'refunded'];

function makeBookings(prefix: string, count: number, routes: string[], dates: string[], seatClass?: string): OperatorBooking[] {
  const bookings: OperatorBooking[] = [];
  const currencies = ['TZS', 'USD'];
  const seatLetters = ['A', 'B', 'C', 'D'];
  for (let i = 0; i < count; i++) {
    const status = STATUSES[i % STATUSES.length];
    const seatCount = (i % 3) + 1;
    const seats: string[] = [];
    for (let s = 0; s < seatCount; s++) {
      seats.push(`${(s + 1) + Math.floor(i / 3)}${seatLetters[s % 4]}`);
    }
    bookings.push({
      id: `${prefix}_bk_${i + 1}`,
      reference: `${prefix.toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
      serviceId: `${prefix}_svc_${(i % 3) + 1}`,
      route: routes[i % routes.length],
      date: dates[i % dates.length],
      passengers: seatCount,
      amount: status === 'cancelled' || status === 'refunded' ? 0 : (i + 1) * 12000 + 8000,
      currency: currencies[i % currencies.length],
      status,
      customerName: NAMES[i % NAMES.length],
      customerPhone: `+255 7${String(20 + i).slice(-2)} ${String(100000 + i * 137).slice(0, 3)} ${String(200 + i * 53).slice(0, 3)}`,
      customerEmail: EMAILS[i % EMAILS.length],
      seatNumbers: seats,
      classBooked: seatClass ? (i % 3 === 0 ? seatClass : i % 3 === 1 ? 'VIP' : 'Economy') : undefined,
      bookedAt: `${dates[i % dates.length]}T${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
    });
  }
  return bookings;
}

const BUS_ROUTES = ['Dar es Salaam → Morogoro', 'Dar es Salaam → Dodoma', 'Dar es Salaam → Arusha', 'Dar es Salaam → Mwanza', 'Morogoro → Iringa'];
const FERRY_ROUTES = ['Dar es Salaam → Zanzibar', 'Zanzibar → Dar es Salaam', 'Zanzibar → Pemba'];
const DATES = ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];

function makeRevenueHistory(count: number, base: number, variance: number): RevenueDay[] {
  const history: RevenueDay[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date('2026-10-23');
    d.setDate(d.getDate() - i);
    history.push({
      date: d.toISOString().slice(0, 10),
      revenue: Math.max(0, base + Math.floor(Math.sin(i * 1.3) * variance)),
      bookings: Math.max(0, Math.floor(base / 15000) + Math.floor(Math.sin(i * 0.9) * 5)),
    });
  }
  return history;
}

function makeBusSchedule(operatorId: string, id: string, origin: string, dest: string, depTime: string, arrTime: string, duration: string, date: string, booked: number, total: number, fare: number, status: ScheduleItem['status']): ScheduleItem {
  return { id, origin, destination: dest, departureTime: depTime, arrivalTime: arrTime, departureDate: date, duration, status, bookedSeats: booked, totalSeats: total, fare, currency: 'TZS' };
}

function makeFerrySchedule(id: string, origin: string, dest: string, depTime: string, arrTime: string, duration: string, date: string, booked: number, total: number, fare: number, status: ScheduleItem['status']): ScheduleItem {
  return { id, origin, destination: dest, departureTime: depTime, arrivalTime: arrTime, departureDate: date, duration, status, bookedSeats: booked, totalSeats: total, fare, currency: 'USD' };
}

function slimBusTrip(
  id: string, operatorId: string, operatorName: string, operatorLogo: string,
  origin: string, destination: string, depTerminal: string, arrTerminal: string,
  depTime: string, arrTime: string, duration: string, busClass: string, busModel: string,
  reg: string, amenities: string[], availableSeats: number, fare: number,
): BusTrip {
  return {
    id, operatorId, operatorName, operatorLogo,
    serviceOrigin: origin, serviceDestination: destination,
    passengerOrigin: origin, passengerDestination: destination,
    departureTerminal: depTerminal, arrivalTerminal: arrTerminal,
    departureTime: depTime, arrivalTime: arrTime,
    departureDate: '2026-10-25', arrivalDate: '2026-10-25',
    duration, intermediateStops: [],
    busClass, busModel, registrationNumber: reg, amenities,
    availableSeats, segmentFare: fare, currency: 'TZS',
    seatMap: { rows: 11, columns: ['A', 'B', '_', 'C', 'D'], layout: [], busModel, busClass, registrationNumber: reg },
    boardingPoints: [], dropOffPoints: [],
  };
}

function slimFerrySailing(
  id: string, operatorId: string, operatorName: string, operatorLogo: string,
  vessel: string, depPort: string, arrPort: string,
  depTime: string, arrTime: string, duration: string,
  classes: FerrySailing['classes'],
): FerrySailing {
  return {
    id, operatorId, operatorName, operatorLogo,
    vesselName: vessel, departurePort: depPort, arrivalPort: arrPort,
    departureTime: depTime, arrivalTime: arrTime,
    departureDate: '2026-10-25', arrivalDate: '2026-10-25',
    duration, classes,
  };
}

export const BUS_OPERATORS: BusOperatorData[] = [
  {
    operatorId: 'op_001', operatorName: 'Kilimanjaro Express', operatorLogo: 'KE',
    totalTrips: 2, activeTrips: 2, totalBookings: 34,
    confirmedBookings: 26, pendingBookings: 5, cancelledBookings: 3,
    totalRevenue: 680000, currency: 'TZS',
    trips: [
      slimBusTrip('bus_001', 'op_001', 'Kilimanjaro Express', 'KE', 'Dar es Salaam', 'Morogoro', 'Ubungo Terminal', 'Morogoro Bus Stand', '06:00', '08:30', '2h 30m', 'AC Luxury VIP', 'Yutong F12', 'T 123 ABC', ['Air Conditioning', 'WiFi', 'USB Charging'], 28, 12000),
      slimBusTrip('bus_003', 'op_001', 'Kilimanjaro Express', 'KE', 'Dar es Salaam', 'Dodoma', 'Ubungo Terminal', 'Dodoma Bus Terminal', '06:00', '11:00', '5h 00m', 'AC Luxury VVIP', 'Yutong F13', 'T 789 GHI', ['Air Conditioning', 'WiFi', 'USB Charging', 'Snack Service'], 15, 25000),
    ],
    bookings: makeBookings('KE', 34, BUS_ROUTES, DATES),
    fleet: [
      { id: 'veh_001', registrationNumber: 'T 123 ABC', model: 'Yutong F12', class: 'AC Luxury VIP', totalSeats: 44, status: 'active', lastService: '2026-10-15', mileage: 245000, assignedTripId: 'bus_001' },
      { id: 'veh_002', registrationNumber: 'T 789 GHI', model: 'Yutong F13', class: 'AC Luxury VVIP', totalSeats: 44, status: 'active', lastService: '2026-10-10', mileage: 189000, assignedTripId: 'bus_003' },
      { id: 'veh_003', registrationNumber: 'T 456 SPARE', model: 'Golden Dragon XML6128', class: 'AC Semi Luxury', totalSeats: 44, status: 'maintenance', lastService: '2026-10-20', mileage: 312000, assignedTripId: null },
    ],
    schedules: [
      makeBusSchedule('op_001', 'sch_001', 'Dar es Salaam', 'Morogoro', '06:00', '08:30', '2h 30m', '2026-10-25', 16, 44, 12000, 'scheduled'),
      makeBusSchedule('op_001', 'sch_002', 'Dar es Salaam', 'Dodoma', '06:00', '11:00', '5h 00m', '2026-10-25', 29, 44, 25000, 'scheduled'),
      makeBusSchedule('op_001', 'sch_003', 'Dar es Salaam', 'Morogoro', '06:00', '08:30', '2h 30m', '2026-10-26', 8, 44, 12000, 'scheduled'),
      makeBusSchedule('op_001', 'sch_004', 'Dar es Salaam', 'Dodoma', '06:00', '11:00', '5h 00m', '2026-10-26', 12, 44, 25000, 'scheduled'),
    ],
    revenueHistory: makeRevenueHistory(14, 95000, 35000),
  },
  {
    operatorId: 'op_002', operatorName: 'Shabibert Lines', operatorLogo: 'SL',
    totalTrips: 2, activeTrips: 2, totalBookings: 28,
    confirmedBookings: 22, pendingBookings: 4, cancelledBookings: 2,
    totalRevenue: 420000, currency: 'TZS',
    trips: [
      slimBusTrip('bus_002', 'op_002', 'Shabibert Lines', 'SL', 'Dar es Salaam', 'Morogoro', 'Ubungo Terminal', 'Morogoro Bus Stand', '07:30', '10:00', '2h 30m', 'AC Semi Luxury', 'Golden Dragon XML6128', 'T 456 DEF', ['Air Conditioning', 'USB Charging'], 35, 10000),
      slimBusTrip('bus_005', 'op_002', 'Shabibert Lines', 'SL', 'Morogoro', 'Iringa', 'Morogoro Bus Stand', 'Iringa Bus Terminal', '10:30', '13:30', '3h 00m', 'AC Semi Luxury', 'Golden Dragon XML6128', 'T 654 MNO', ['Air Conditioning', 'USB Charging'], 38, 14000),
    ],
    bookings: makeBookings('SL', 28, BUS_ROUTES, DATES),
    fleet: [
      { id: 'veh_004', registrationNumber: 'T 456 DEF', model: 'Golden Dragon XML6128', class: 'AC Semi Luxury', totalSeats: 44, status: 'active', lastService: '2026-10-18', mileage: 278000, assignedTripId: 'bus_002' },
      { id: 'veh_005', registrationNumber: 'T 654 MNO', model: 'Golden Dragon XML6128', class: 'AC Semi Luxury', totalSeats: 44, status: 'active', lastService: '2026-10-12', mileage: 295000, assignedTripId: 'bus_005' },
    ],
    schedules: [
      makeBusSchedule('op_002', 'sch_005', 'Dar es Salaam', 'Morogoro', '07:30', '10:00', '2h 30m', '2026-10-25', 9, 44, 10000, 'scheduled'),
      makeBusSchedule('op_002', 'sch_006', 'Morogoro', 'Iringa', '10:30', '13:30', '3h 00m', '2026-10-25', 6, 44, 14000, 'scheduled'),
    ],
    revenueHistory: makeRevenueHistory(14, 60000, 20000),
  },
  {
    operatorId: 'op_003', operatorName: 'Sumry Transportation', operatorLogo: 'ST',
    totalTrips: 1, activeTrips: 1, totalBookings: 19,
    confirmedBookings: 15, pendingBookings: 3, cancelledBookings: 1,
    totalRevenue: 270000, currency: 'TZS',
    trips: [
      slimBusTrip('bus_004', 'op_003', 'Sumry Transportation', 'ST', 'Dar es Salaam', 'Arusha', 'Ubungo Terminal', 'Arusha Bus Terminal', '06:30', '13:00', '6h 30m', 'Non-AC Semi Luxury', 'Scania K410', 'T 321 JKL', ['USB Charging', 'Reclining Seats'], 40, 18000),
    ],
    bookings: makeBookings('ST', 19, BUS_ROUTES, DATES),
    fleet: [
      { id: 'veh_006', registrationNumber: 'T 321 JKL', model: 'Scania K410', class: 'Non-AC Semi Luxury', totalSeats: 44, status: 'active', lastService: '2026-10-05', mileage: 356000, assignedTripId: 'bus_004' },
    ],
    schedules: [
      makeBusSchedule('op_003', 'sch_007', 'Dar es Salaam', 'Arusha', '06:30', '13:00', '6h 30m', '2026-10-25', 4, 44, 18000, 'scheduled'),
    ],
    revenueHistory: makeRevenueHistory(14, 38000, 15000),
  },
  {
    operatorId: 'op_004', operatorName: 'Tahmeed Express', operatorLogo: 'TE',
    totalTrips: 1, activeTrips: 1, totalBookings: 16,
    confirmedBookings: 12, pendingBookings: 2, cancelledBookings: 2,
    totalRevenue: 264000, currency: 'TZS',
    trips: [
      slimBusTrip('bus_006', 'op_004', 'Tahmeed Express', 'TE', 'Dar es Salaam', 'Dodoma', 'Ubungo Terminal', 'Dodoma Bus Terminal', '05:00', '10:00', '5h 00m', 'AC Luxury VIP', 'Yutong F12', 'T 987 PQR', ['Air Conditioning', 'WiFi', 'USB Charging'], 22, 22000),
    ],
    bookings: makeBookings('TE', 16, BUS_ROUTES, DATES),
    fleet: [
      { id: 'veh_007', registrationNumber: 'T 987 PQR', model: 'Yutong F12', class: 'AC Luxury VIP', totalSeats: 44, status: 'active', lastService: '2026-10-08', mileage: 201000, assignedTripId: 'bus_006' },
    ],
    schedules: [
      makeBusSchedule('op_004', 'sch_008', 'Dar es Salaam', 'Dodoma', '05:00', '10:00', '5h 00m', '2026-10-25', 22, 44, 22000, 'scheduled'),
    ],
    revenueHistory: makeRevenueHistory(14, 37000, 12000),
  },
];

export const FERRY_OPERATORS: FerryOperatorData[] = [
  {
    operatorId: 'fop_001', operatorName: 'Azam Marine', operatorLogo: 'AM',
    totalSailings: 2, activeSailings: 2, totalBookings: 42,
    confirmedBookings: 34, pendingBookings: 5, cancelledBookings: 3,
    totalRevenue: 4200, currency: 'USD',
    sailings: [
      slimFerrySailing('ferry_001', 'fop_001', 'Azam Marine', 'AM', 'Kilimanjaro VIII', 'Dar es Salaam Port', 'Zanzibar Port', '09:00', '11:30', '2h 30m', [
        { id: 'fc_econ', name: 'Economy', adultFare: 35, childFare: 20, residentAdultFare: 35000, residentChildFare: 20000, capacity: 200, availableCapacity: 145, currency: 'USD', description: 'Open deck seating.' },
        { id: 'fc_vip', name: 'VIP', adultFare: 50, childFare: 30, residentAdultFare: 50000, residentChildFare: 30000, capacity: 80, availableCapacity: 52, currency: 'USD', description: 'Air-conditioned reserved seating.' },
        { id: 'fc_business', name: 'Business', adultFare: 70, childFare: 45, residentAdultFare: 70000, residentChildFare: 45000, capacity: 40, availableCapacity: 28, currency: 'USD', description: 'Premium seating with refreshments.' },
        { id: 'fc_royal', name: 'Royal', adultFare: 100, childFare: 60, residentAdultFare: 100000, residentChildFare: 60000, capacity: 20, availableCapacity: 15, currency: 'USD', description: 'Private cabin with lounge access.' },
      ]),
      slimFerrySailing('ferry_003', 'fop_001', 'Azam Marine', 'AM', 'Kilimanjaro VII', 'Zanzibar Port', 'Pemba Port (Mkoani)', '07:00', '12:00', '5h 00m', [
        { id: 'fc_econ3', name: 'Economy', adultFare: 45, childFare: 25, residentAdultFare: 45000, residentChildFare: 25000, capacity: 180, availableCapacity: 120, currency: 'USD', description: 'Open deck seating.' },
        { id: 'fc_business3', name: 'Business', adultFare: 80, childFare: 50, residentAdultFare: 80000, residentChildFare: 50000, capacity: 50, availableCapacity: 35, currency: 'USD', description: 'Premium seating with refreshments.' },
      ]),
    ],
    bookings: makeBookings('AM', 42, FERRY_ROUTES, DATES, 'Business'),
    vessels: [
      { id: 'fsv_001', name: 'Kilimanjaro VIII', totalCapacity: 340, status: 'active', lastInspection: '2026-09-15', yearBuilt: 2019, assignedSailingId: 'ferry_001' },
      { id: 'fsv_002', name: 'Kilimanjaro VII', totalCapacity: 230, status: 'active', lastInspection: '2026-08-20', yearBuilt: 2016, assignedSailingId: 'ferry_003' },
      { id: 'fsv_003', name: 'Kilimanjaro V', totalCapacity: 280, status: 'dry_dock', lastInspection: '2026-07-01', yearBuilt: 2012, assignedSailingId: null },
    ],
    schedules: [
      makeFerrySchedule('fsch_001', 'Dar es Salaam Port', 'Zanzibar Port', '09:00', '11:30', '2h 30m', '2026-10-25', 195, 340, 35, 'scheduled'),
      makeFerrySchedule('fsch_002', 'Zanzibar Port', 'Pemba Port (Mkoani)', '07:00', '12:00', '5h 00m', '2026-10-25', 110, 230, 45, 'scheduled'),
      makeFerrySchedule('fsch_003', 'Dar es Salaam Port', 'Zanzibar Port', '09:00', '11:30', '2h 30m', '2026-10-26', 80, 340, 35, 'scheduled'),
    ],
    revenueHistory: makeRevenueHistory(14, 300, 120),
  },
  {
    operatorId: 'fop_002', operatorName: 'Zanzibar Ferries', operatorLogo: 'ZF',
    totalSailings: 1, activeSailings: 1, totalBookings: 25,
    confirmedBookings: 20, pendingBookings: 3, cancelledBookings: 2,
    totalRevenue: 1850, currency: 'USD',
    sailings: [
      slimFerrySailing('ferry_002', 'fop_002', 'Zanzibar Ferries', 'ZF', 'Sea Express', 'Dar es Salaam Port', 'Zanzibar Port', '12:00', '14:30', '2h 30m', [
        { id: 'fc_econ2', name: 'Economy', adultFare: 30, childFare: 18, residentAdultFare: 30000, residentChildFare: 18000, capacity: 250, availableCapacity: 210, currency: 'USD', description: 'Open deck seating.' },
        { id: 'fc_vip2', name: 'VIP', adultFare: 45, childFare: 25, residentAdultFare: 45000, residentChildFare: 25000, capacity: 100, availableCapacity: 78, currency: 'USD', description: 'Air-conditioned reserved seating.' },
      ]),
    ],
    bookings: makeBookings('ZF', 25, FERRY_ROUTES, DATES, 'VIP'),
    vessels: [
      { id: 'fsv_004', name: 'Sea Express', totalCapacity: 350, status: 'active', lastInspection: '2026-09-28', yearBuilt: 2018, assignedSailingId: 'ferry_002' },
    ],
    schedules: [
      makeFerrySchedule('fsch_004', 'Dar es Salaam Port', 'Zanzibar Port', '12:00', '14:30', '2h 30m', '2026-10-25', 62, 350, 30, 'scheduled'),
    ],
    revenueHistory: makeRevenueHistory(14, 130, 50),
  },
];
