export type BookingMode = 'bus' | 'ferry' | 'flights' | 'train' | 'stays' | 'experiences';

export type PassengerCategory = 'adult' | 'child' | 'infant';

export type Gender = 'male' | 'female';

export type IdType = 'driving_licence' | 'national_id' | 'passport' | 'voter_card';

export type PaymentMethod = 'mobile_money' | 'card' | 'coupon';

export type BookingStatus =
  | 'draft'
  | 'pending_payment'
  | 'confirmed'
  | 'failed'
  | 'expired'
  | 'cancelled';

export type PaymentStatus =
  | 'idle'
  | 'processing'
  | 'pending'
  | 'success'
  | 'failed'
  | 'timeout';

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  currency: string;
  currencySymbol: string;
}

export interface MarketConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  currencySymbol: string;
  languages: string[];
  availableModes: BookingMode[];
  paymentMethods: PaymentMethod[];
  mobileMoneyProviders: string[];
}

export interface PassengerInfo {
  id: string;
  seatId?: string;
  category: PassengerCategory;
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  gender: Gender;
  countryOfResidence: string;
  idType?: IdType;
  idNumber?: string;
  idCountryOfIssue?: string;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  type: 'city' | 'town' | 'terminal' | 'station' | 'port' | 'airport';
  country: string;
}

export interface BusStop {
  id: string;
  name: string;
  location: string;
  time: string;
  order: number;
}

export interface BusSeat {
  id: string;
  row: number;
  column: string;
  label: string;
  type: 'seat' | 'driver' | 'aisle' | 'empty';
  status: 'available' | 'occupied' | 'selected' | 'reserved';
  deck?: 'lower' | 'upper';
}

export interface BusSeatMap {
  rows: number;
  columns: string[];
  layout: BusSeat[][];
  busModel: string;
  busClass: string;
  registrationNumber: string;
}

export interface BusTrip {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
  serviceOrigin: string;
  serviceDestination: string;
  passengerOrigin: string;
  passengerDestination: string;
  departureTerminal: string;
  arrivalTerminal: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  intermediateStops: BusStop[];
  busClass: string;
  busModel: string;
  registrationNumber: string;
  amenities: string[];
  availableSeats: number;
  segmentFare: number;
  currency: string;
  seatMap: BusSeatMap;
  boardingPoints: BusStop[];
  dropOffPoints: BusStop[];
}

export interface FerryVesselClass {
  id: string;
  name: string;
  adultFare: number;
  childFare: number;
  residentAdultFare: number;
  residentChildFare: number;
  capacity: number;
  availableCapacity: number;
  currency: string;
  description: string;
}

export interface FerrySailing {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
  vesselName: string;
  departurePort: string;
  arrivalPort: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  classes: FerryVesselClass[];
}

export interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  aircraft: string;
}

export interface FlightResult {
  id: string;
  segments: FlightSegment[];
  totalPrice: number;
  currency: string;
  cabinClass: string;
  baggageInfo: string;
  refundable: boolean;
  fareConditions: string;
}

export interface TrainService {
  id: string;
  operatorName: string;
  trainName: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  duration: string;
  classes: TrainClass[];
}

export interface TrainClass {
  id: string;
  name: string;
  fare: number;
  currency: string;
  availableSeats: number;
  hasSeatSelection: boolean;
}

export interface StayProperty {
  id: string;
  name: string;
  location: string;
  city: string;
  type: string;
  starRating: number;
  image: string;
  rooms: StayRoom[];
  amenities: string[];
  cancellationPolicy: string;
  distanceFromCenter: string;
}

export interface StayRoom {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  pricePerNight: number;
  currency: string;
  includedServices: string[];
  cancellationPolicy: string;
  available: number;
}

export interface Experience {
  id: string;
  name: string;
  location: string;
  city: string;
  image: string;
  duration: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  availableDates: string[];
  sessions: string[];
  meetingPoint: string;
  cancellationPolicy: string;
  description: string;
}

export interface BookingReview {
  mode: BookingMode;
  serviceId: string;
  operatorName: string;
  journeySummary: string;
  departureInfo: string;
  arrivalInfo: string;
  travelDate: string;
  duration: string;
  passengers: PassengerInfo[];
  fareBreakdown: FareLine[];
  totalAmount: number;
  currency: string;
  extras: Record<string, string>;
}

export interface FareLine {
  label: string;
  amount: number;
  type: 'fare' | 'tax' | 'fee' | 'discount' | 'total';
}

export interface SearchParams {
  mode: BookingMode;
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  extras?: Record<string, string>;
}
