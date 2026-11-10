export type BookingMode = 'bus' | 'ferry' | 'flights' | 'train' | 'stays' | 'experiences';

export type PassengerCategory = 'adult' | 'child' | 'infant';

export type Gender = 'male' | 'female';

export type IdType = 'driving_licence' | 'national_id' | 'passport' | 'voter_card';

export type TrainResidency = 'resident' | 'non_resident';

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
  /** The booking exists and is waiting for the provider to confirm the money. */
  | 'pending'
  | 'success'
  | 'failed'
  | 'timeout'
  | 'unavailable';

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
  /** Search tabs. Inventory and OD still decide what a journey can actually sell. */
  availableModes: BookingMode[];
  /**
   * Collection methods this point of sale may offer. Empty until a merchant row is
   * licensed — the adapters already exist; licensing is activation, not a rebuild.
   */
  paymentMethods: PaymentMethod[];
  mobileMoneyProviders: string[];
  /** True when this POS may collect. Search does not require it. */
  posLicensed: boolean;
}

export interface PassengerInfo {
  id: string;
  /** Seat for the outbound leg (SGR: `coach-seat`, e.g. `2-14`). */
  seatId?: string;
  /** Seat for the return leg on a round trip. */
  returnSeatId?: string;
  /** Fare category, chosen by the traveller. It prices the seat, so nothing may assume it. */
  category?: PassengerCategory;
  fullName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  gender?: Gender;
  countryOfResidence: string;
  idType?: IdType;
  idNumber?: string;
  idCountryOfIssue?: string;
  trainResidency?: TrainResidency;
  trainHasLuggage?: boolean;
  trainRequiresWheelchair?: boolean;
}

export interface Location {
  id: string;
  name: string;
  region: string;
  type: 'city' | 'town' | 'terminal' | 'station' | 'port' | 'airport';
  country: string;
  /**
   * Modes that actually serve this place. Omitted means every mode with a matching
   * location list. Zanzibar and Pemba are cities but islands: reachable by ferry and air,
   * never by intercity bus, and offering them in a bus search always ended in no results.
   */
  modes?: BookingMode[];
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
  /** False when resident TZS fares were never published. Do not treat 0 as a free fare. */
  hasResidentFare?: boolean;
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
  /** Operator trip number printed on the ticket (SGR "Trips No"). */
  tripNumber?: string;
  classes: TrainClass[];
}

/** A single seat inside a coach, as printed on an SGR ticket (coach + seat no). */
export interface TrainSeat {
  /** `${coachNumber}-${number}`, the value stored on the passenger. */
  id: string;
  number: number;
  row: number;
  /** 1–4 across the carriage; the aisle sits between lanes 2 and 3. */
  lane: number;
  wheelchair: boolean;
  taken: boolean;
  /**
   * The inventory state when it is known. `taken` alone cannot tell a passenger that a seat
   * is somebody else's held seat from one the operator never put on sale, and those need
   * different answers on the map.
   */
  state?: 'AVAILABLE' | 'HELD' | 'SOLD' | 'BLOCKED' | 'NOT_SELLABLE';
}

export interface TrainCoach {
  number: number;
  className: string;
  capacity: number;
  seats: TrainSeat[];
}

export interface TrainClass {
  id: string;
  name: string;
  fare: number;
  currency: string;
  availableSeats: number;
  hasSeatSelection: boolean;
  /** Coach inventory for this class on this service. */
  coaches?: TrainCoach[];
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
  /** Ordered legs of a multi-city flight search. Leg 1 mirrors origin/destination/date. */
  legs?: FlightLeg[];
  extras?: Record<string, string>;
}

export interface FlightLeg {
  origin: string;
  destination: string;
  date: string;
}
