import type { TrainClass, TrainCoach, TrainSeat, TrainService } from '@/types';

/**
 * Tanzania SGR (Dar es Salaam — Dodoma corridor), captured from the operator's live
 * ticketing system: the station order, the ten daily services in both directions, the
 * coach inventory of both train sets, and the published journey fares.
 *
 * Seat numbering follows the operator's map: four seats across the carriage with the
 * aisle between lanes 2 and 3, numbered 1..N rowwise (1,2,3,4 · 5,6,7,8 · …). Coaches
 * that list wheelchair capacity carry those seats after the standard ones.
 */

export const SGR_OPERATOR = 'Tanzania Railways Corporation';

export const SGR_STATIONS = [
  // The platform's canonical name for the city, matching `app.location` and the search
  // card. The operator's own site capitalises this 'Dar Es Salaam', which made the results
  // header show a different place than the one the traveller had just chosen.
  'Dar es Salaam',
  'Pugu',
  'Soga',
  'Ruvu',
  'Ngerengere',
  'Morogoro',
  'Mkata',
  'Kilosa',
  'Kidete',
  'Gulwe',
  'Igandu',
  'Dodoma',
] as const;

type CoachClass = 'Royal Class' | 'Business' | 'Economy';

interface CoachSpec {
  number: number;
  className: CoachClass;
  standard: number;
  wheelchair: number;
}

/**
 * The 14-coach set that runs EXPRESS and ORDINARY LINE services: one Royal coach, two
 * Business coaches (one of them with a wheelchair space) and eleven Economy coaches.
 * Capacities are the operator's published ones.
 */
const STANDARD_SET: CoachSpec[] = [
  { number: 1, className: 'Royal Class', standard: 44, wheelchair: 0 },
  { number: 2, className: 'Business', standard: 44, wheelchair: 1 },
  { number: 3, className: 'Business', standard: 48, wheelchair: 0 },
  { number: 4, className: 'Economy', standard: 74, wheelchair: 2 },
  ...Array.from({ length: 10 }, (_, index) => ({
    number: 5 + index,
    className: 'Economy' as const,
    standard: 78,
    wheelchair: 0,
  })),
];

/** The 8-coach premium set used by ROYAL EXPRESS: one Royal coach and seven Business. */
const ROYAL_SET: CoachSpec[] = [
  { number: 1, className: 'Royal Class', standard: 39, wheelchair: 0 },
  { number: 2, className: 'Business', standard: 90, wheelchair: 0 },
  { number: 3, className: 'Business', standard: 74, wheelchair: 0 },
  { number: 4, className: 'Business', standard: 54, wheelchair: 2 },
  { number: 5, className: 'Business', standard: 90, wheelchair: 0 },
  { number: 6, className: 'Business', standard: 74, wheelchair: 0 },
  { number: 7, className: 'Business', standard: 90, wheelchair: 0 },
  { number: 8, className: 'Business', standard: 70, wheelchair: 0 },
];

/**
 * Class prices measured on the 06:00 Dar es Salaam → Dodoma EXPRESS (TZS): Economy is
 * the published journey fare, Business adds 30,000 and Royal Class adds 40,000. The
 * same differential is applied to the other services until the fare endpoint that the
 * operator's seat page uses is wired to the API.
 */
const CLASS_SURCHARGE: Record<CoachClass, number> = {
  Economy: 0,
  Business: 30_000,
  'Royal Class': 40_000,
};

/** Used for the ROYAL EXPRESS, whose journey fare is not published by the search API. */
const EXPRESS_BASE_FARE = 50_500;

interface SgrTrip {
  id: string;
  name: string;
  tripNumber: string;
  direction: 'outbound' | 'return';
  departure: string;
  arrival: string;
  /** Published journey fare; 0 means the operator does not publish it on search. */
  baseFare: number;
  coachSet: 'standard' | 'royal';
}

export const SGR_TRIPS: SgrTrip[] = [
  // Dar es Salaam → Dodoma
  { id: 'sgr_001', name: 'DAR -- DOM | EXPRESS', tripNumber: '0011904', direction: 'outbound', departure: '06:00', arrival: '09:50', baseFare: 50_500, coachSet: 'standard' },
  { id: 'sgr_002', name: 'DAR // DOM | ROYAL EXPRESS', tripNumber: '011906', direction: 'outbound', departure: '07:20', arrival: '10:37', baseFare: 0, coachSet: 'royal' },
  { id: 'sgr_003', name: 'DAR / DOM | ORDINARY LINE', tripNumber: '011908', direction: 'outbound', departure: '09:40', arrival: '13:37', baseFare: 31_500, coachSet: 'standard' },
  { id: 'sgr_004', name: 'DAR // DOM || ROYAL EXPRESS', tripNumber: '011910', direction: 'outbound', departure: '13:10', arrival: '16:36', baseFare: 0, coachSet: 'royal' },
  { id: 'sgr_005', name: 'DAR / DOM || ORDINARY LINE', tripNumber: '011912', direction: 'outbound', departure: '18:55', arrival: '23:01', baseFare: 31_500, coachSet: 'standard' },
  // Dodoma → Dar es Salaam
  { id: 'sgr_101', name: 'DOM - DAR || EXPRESS', tripNumber: '0020102', direction: 'return', departure: '05:15', arrival: '09:09', baseFare: 50_500, coachSet: 'standard' },
  { id: 'sgr_102', name: 'DOM // DAR | ROYAL EXPRESS', tripNumber: '00020103', direction: 'return', departure: '07:35', arrival: '11:04', baseFare: 0, coachSet: 'royal' },
  { id: 'sgr_103', name: 'DOM / DAR | ORDINARY LINE', tripNumber: '020106', direction: 'return', departure: '14:15', arrival: '18:17', baseFare: 31_500, coachSet: 'standard' },
  { id: 'sgr_104', name: 'DOM // DAR - ORDINARY LINE', tripNumber: '020108', direction: 'return', departure: '17:15', arrival: '21:10', baseFare: 31_500, coachSet: 'standard' },
  { id: 'sgr_105', name: 'DOM -- DAR || ROYAL EXPRESS', tripNumber: '0020109', direction: 'return', departure: '18:40', arrival: '21:57', baseFare: 0, coachSet: 'royal' },
];

/** Deterministic occupancy so the map has taken seats before the inventory API exists. */
function isTaken(tripNumber: string, coachNumber: number, seatNumber: number): boolean {
  const seed = `${tripNumber}:${coachNumber}:${seatNumber}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 100_000;
  }
  return hash % 7 === 0;
}

function buildSeats(tripNumber: string, spec: CoachSpec): TrainSeat[] {
  const seats: TrainSeat[] = [];
  for (let index = 0; index < spec.standard; index += 1) {
    const number = index + 1;
    seats.push({
      id: `${spec.number}-${number}`,
      number,
      row: Math.floor(index / 4) + 1,
      lane: (index % 4) + 1,
      wheelchair: false,
      taken: isTaken(tripNumber, spec.number, number),
    });
  }
  for (let index = 0; index < spec.wheelchair; index += 1) {
    const number = spec.standard + index + 1;
    seats.push({
      id: `${spec.number}-${number}`,
      number,
      row: Math.ceil(spec.standard / 4) + 1,
      lane: 0,
      wheelchair: true,
      taken: false,
    });
  }
  return seats;
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function durationBetween(departure: string, arrival: string): string {
  const minutes = (minutesOf(arrival) - minutesOf(departure) + 24 * 60) % (24 * 60);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function buildClasses(trip: SgrTrip): TrainClass[] {
  const spec = trip.coachSet === 'royal' ? ROYAL_SET : STANDARD_SET;
  const baseFare = trip.baseFare > 0 ? trip.baseFare : EXPRESS_BASE_FARE;
  const byClass = new Map<CoachClass, TrainCoach[]>();

  for (const coach of spec) {
    const coaches = byClass.get(coach.className) ?? [];
    coaches.push({
      number: coach.number,
      className: coach.className,
      capacity: coach.standard + coach.wheelchair,
      seats: buildSeats(trip.tripNumber, coach),
    });
    byClass.set(coach.className, coaches);
  }

  return [...byClass.entries()].map(([className, coaches]) => ({
    id: `${trip.id}_${className.toLowerCase().replace(/\s+/g, '_')}`,
    name: className,
    fare: baseFare + CLASS_SURCHARGE[className],
    currency: 'TZS',
    availableSeats: coaches.reduce(
      (total, coach) => total + coach.seats.filter((seat) => !seat.taken).length,
      0,
    ),
    hasSeatSelection: true,
    coaches,
  }));
}

function toService(trip: SgrTrip, departureDate: string): TrainService {
  const [from, to] = trip.direction === 'outbound'
    ? [SGR_STATIONS[0], SGR_STATIONS[SGR_STATIONS.length - 1]]
    : [SGR_STATIONS[SGR_STATIONS.length - 1], SGR_STATIONS[0]];

  return {
    id: trip.id,
    operatorName: SGR_OPERATOR,
    trainName: trip.name,
    departureStation: from,
    arrivalStation: to,
    departureTime: trip.departure,
    arrivalTime: trip.arrival,
    departureDate,
    duration: durationBetween(trip.departure, trip.arrival),
    tripNumber: trip.tripNumber,
    classes: buildClasses(trip),
  };
}

/** Services for a direction, stamped with the date the traveller searched for. */
export function sgrServices(direction: 'outbound' | 'return', departureDate: string): TrainService[] {
  return SGR_TRIPS.filter((trip) => trip.direction === direction).map((trip) => toService(trip, departureDate));
}

export const SGR_TRAIN_SERVICES: TrainService[] = sgrServices('outbound', '2026-10-30');
export const SGR_RETURN_SERVICES: TrainService[] = sgrServices('return', '2026-11-05');
