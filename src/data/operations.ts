import type { BusStop, BusTrip, FerrySailing, FerryVesselClass } from '@/types';

/**
 * Operational core for the Travelar network.
 *
 * Both internal systems read and write this store:
 *   - OIMS (operator console) owns the data of a single operator: routes, stops,
 *     segment fares, seat maps, vehicles/vessels, schedules and the manifest.
 *   - HIMS (HQ console) oversees every operator on the platform.
 *
 * The public search card, result cards and booking flow read the same store, so
 * whatever an operator configures here is what a passenger sees. The store lives
 * in memory for now; the API layer will replace the mutation functions one for
 * one, keeping these signatures.
 */

export type OpsMode = 'bus' | 'ferry';

export interface RouteStop {
  id: string;
  name: string;
  terminal: string;
  /** Minutes after departure. */
  offsetMinutes: number;
}

export interface SegmentFare {
  fromStopId: string;
  toStopId: string;
  fare: number;
}

export interface OpsRoute {
  id: string;
  operatorId: string;
  mode: OpsMode;
  name: string;
  stops: RouteStop[];
  segmentFares: SegmentFare[];
}

export interface SeatMapConfig {
  id: string;
  operatorId: string;
  name: string;
  rows: number;
  /** Column letters in seat order; `_` marks the aisle. */
  columns: string[];
}

export interface OpsVehicle {
  id: string;
  operatorId: string;
  registrationNumber: string;
  model: string;
  busClass: string;
  seatMapId: string;
  amenities: string[];
  status: 'active' | 'maintenance' | 'retired';
  lastService: string;
  mileage: number;
}
export interface OpsVessel {
  id: string;
  operatorId: string;
  name: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'dry_dock';
  lastInspection: string;
  yearBuilt: number;
  classes: FerryVesselClass[];
}

export interface OpsSchedule {
  id: string;
  operatorId: string;
  mode: OpsMode;
  routeId: string;
  vehicleId: string | null;
  vesselId: string | null;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  departureDate: string;
  arrivalDate: string;
  currency: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'completed' | 'cancelled';
  /** Seats released for sale; defaults to the vehicle/vessel capacity. */
  seatsForSale: number | null;
  boardingPoints: BusStop[];
  dropOffPoints: BusStop[];
}

export interface OpsBooking {
  id: string;
  /** Internal booking reference the operator's own system knows it by. */
  reference: string;
  /**
   * Passenger Name Record: the single code a traveller uses to find their ticket,
   * whatever operator sold the seat. One namespace across the network, so the lookup
   * never needs to know who runs the departure.
   */
  pnr: string;
  operatorId: string;
  mode: OpsMode;
  scheduleId: string;
  routeLabel: string;
  date: string;
  passengers: number;
  seats: string[];
  classBooked?: string;
  amount: number;
  currency: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'refunded';
  channel: 'online' | 'otc';
  soldBy?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookedAt: string;
}

export interface OpsOperator {
  id: string;
  mode: OpsMode;
  name: string;
  logo: string;
  contactEmail: string;
  contactPhone: string;
  hqApproved: boolean;
}

export interface OperationsState {
  operators: OpsOperator[];
  routes: OpsRoute[];
  seatMaps: SeatMapConfig[];
  vehicles: OpsVehicle[];
  vessels: OpsVessel[];
  schedules: OpsSchedule[];
  bookings: OpsBooking[];
}

export const BUS_AMENITIES = [
  'Air Conditioning',
  'WiFi',
  'USB Charging',
  'Reclining Seats',
  'Reading Light',
  'Snack Service',
  'Blanket',
];

// ─── PNR ───────────────────────────────────────────────────────────────────

const PNR_PREFIX = 'TRV-';
// Ambiguity-free alphabet: no 0/O or 1/I, because passengers read these off a ticket
// over the phone.
const PNR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Accepts whatever a traveller types - lower case, spaces, a missing dash, or no
 * prefix at all - and returns the canonical `TRV-XXXXXX`, or null when the input
 * cannot be a PNR.
 */
export function normalizePnr(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const body = cleaned.length === 9 && cleaned.startsWith(PNR_PREFIX.replace('-', ''))
    ? cleaned.slice(3)
    : cleaned;
  if (body.length !== 6) return null;
  return `${PNR_PREFIX}${body}`;
}

function randomPnr(): string {
  let suffix = '';
  for (let index = 0; index < 6; index += 1) {
    suffix += PNR_ALPHABET[Math.floor(Math.random() * PNR_ALPHABET.length)];
  }
  return `${PNR_PREFIX}${suffix}`;
}

// ─── Seed ─────────────────────────────────────────────────────────────────

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function emptyOperationsState(): OperationsState {
  return {
    operators: [],
    routes: [],
    seatMaps: [],
    vehicles: [],
    vessels: [],
    schedules: [],
    bookings: [],
  };
}

/**
 * OIMS/HIMS start empty. Operators, routes, schedules and bookings appear only after
 * they are recorded here (or later, from the API). Seeded mock catalogues are not
 * a substitute for inventory that has not been provisioned.
 */
let state: OperationsState = emptyOperationsState();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToOperations(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOperations(): OperationsState {
  return state;
}

function setState(next: Partial<OperationsState>) {
  state = { ...state, ...next };
  emit();
}

let counter = 0;
export function createId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter}`;
}

/** A PNR that no booking on the network already holds. */
function unusedPnr(): string {
  const taken = new Set(state.bookings.map((booking) => booking.pnr));
  let candidate = randomPnr();
  while (taken.has(candidate)) {
    candidate = randomPnr();
  }
  return candidate;
}

/**
 * The one lookup a traveller needs: a PNR returns their booking whichever operator
 * sold it. Matching ignores case, spacing and the prefix.
 */
export function findBookingByPnr(input: string): OpsBooking | null {
  const wanted = normalizePnr(input);
  if (!wanted) return null;
  return state.bookings.find((booking) => booking.pnr === wanted) ?? null;
}

// ─── Reads ─────────────────────────────────────────────────────────────────

export function operatorsFor(mode: OpsMode): OpsOperator[] {
  return state.operators.filter((operator) => operator.mode === mode);
}

export function operatorById(id: string): OpsOperator | undefined {
  return state.operators.find((operator) => operator.id === id);
}

export function routesFor(operatorId: string): OpsRoute[] {
  return state.routes.filter((route) => route.operatorId === operatorId);
}

export function schedulesFor(operatorId: string): OpsSchedule[] {
  return state.schedules.filter((schedule) => schedule.operatorId === operatorId);
}

export function vehiclesFor(operatorId: string): OpsVehicle[] {
  return state.vehicles.filter((vehicle) => vehicle.operatorId === operatorId);
}

export function vesselsFor(operatorId: string): OpsVessel[] {
  return state.vessels.filter((vessel) => vessel.operatorId === operatorId);
}

export function bookingsFor(operatorId: string): OpsBooking[] {
  return state.bookings.filter((booking) => booking.operatorId === operatorId);
}

export function seatMapById(id: string): SeatMapConfig | undefined {
  return state.seatMaps.find((map) => map.id === id);
}

/** Segment fare for a pair of stops, falling back to the route's through fare. */
export function fareForSegment(routeId: string, fromStopId: string, toStopId: string): number | null {
  const route = state.routes.find((candidate) => candidate.id === routeId);
  if (!route) return null;

  const exact = route.segmentFares.find(
    (fare) => fare.fromStopId === fromStopId && fare.toStopId === toStopId,
  );
  if (exact) return exact.fare;

  const through = route.segmentFares.find(
    (fare) => fare.fromStopId === route.stops[0]?.id && fare.toStopId === route.stops[route.stops.length - 1]?.id,
  );
  return through?.fare ?? null;
}

function stopByName(route: OpsRoute, name: string): RouteStop | undefined {
  return route.stops.find((stop) => stop.name === name);
}

function bookedSeats(scheduleId: string): string[] {
  return state.bookings
    .filter((booking) => booking.scheduleId === scheduleId && booking.status === 'confirmed')
    // Departures sold by capacity (ferries) carry no seat numbers, so each passenger
    // still occupies one place.
    .flatMap((booking) => (
      booking.seats.length
        ? booking.seats
        : Array.from({ length: booking.passengers }, (_unused, index) => `${booking.id}-pax-${index + 1}`)
    ));
}

/**
 * Bookings taken online or at the counter occupy real seats: the operator's seat
 * map is the truth, and a paid booking writes through to it.
 */
function withBookedSeats(
  layout: BusTrip['seatMap']['layout'],
  booked: Set<string>,
): BusTrip['seatMap']['layout'] {
  if (booked.size === 0) return layout;
  return layout.map((row) =>
    row.map((cell) => (cell.type === 'seat' && booked.has(cell.id) ? { ...cell, status: 'occupied' } : cell)),
  );
}

function seatCapacity(seatMap: SeatMapConfig | undefined): number {
  if (!seatMap) return 44;
  const seatsPerRow = seatMap.columns.filter((column) => column !== '_').length;
  return seatMap.rows * seatsPerRow;
}

function layoutFor(seatMap: SeatMapConfig | undefined): BusTrip['seatMap']['layout'] {
  if (!seatMap) return [];
  const layout: BusTrip['seatMap']['layout'] = [];
  for (let row = 1; row <= seatMap.rows; row += 1) {
    const cells: BusTrip['seatMap']['layout'][number] = seatMap.columns.map((column) => {
      if (column === '_') return { id: `${row}_aisle`, row, column: '_', label: '', type: 'aisle', status: 'available' };
      const label = `${row}${column}`;
      return { id: label, row, column, label, type: 'seat', status: 'available' };
    });
    layout.push(cells);
  }
  return layout;
}

/** Bus results are composed from operator routes, schedules and fleet. */
export function getBusTrips(): BusTrip[] {
  const trips: BusTrip[] = [];

  for (const schedule of state.schedules.filter((item) => item.mode === 'bus')) {
    const route = state.routes.find((candidate) => candidate.id === schedule.routeId);
    const vehicle = state.vehicles.find((candidate) => candidate.id === schedule.vehicleId);
    const operator = operatorById(schedule.operatorId);
    if (!route || !vehicle || !operator) continue;

    const intermediate = route.stops.slice(1, -1).map((stop, index) => ({
      id: stop.id,
      name: stop.name,
      location: stop.terminal,
      time: addMinutes(schedule.departureTime, stop.offsetMinutes),
      order: index + 1,
    }));
    const originStop = route.stops[0];
    const destinationStop = route.stops[route.stops.length - 1];
    if (!originStop || !destinationStop) continue;
    const bookedSeatIds = new Set(bookedSeats(schedule.id));
    const sold = bookedSeatIds.size;
    const seatMap = seatMapById(vehicle.seatMapId);

    trips.push({
      id: schedule.id,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorLogo: operator.logo,
      serviceOrigin: originStop.name,
      serviceDestination: destinationStop.name,
      passengerOrigin: originStop.name,
      passengerDestination: destinationStop.name,
      departureTerminal: originStop.terminal,
      arrivalTerminal: destinationStop.terminal,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      departureDate: schedule.departureDate,
      arrivalDate: schedule.arrivalDate,
      duration: schedule.duration,
      intermediateStops: intermediate,
      busClass: vehicle.busClass,
      busModel: vehicle.model,
      registrationNumber: vehicle.registrationNumber,
      amenities: [...vehicle.amenities],
      availableSeats: Math.max(0, (schedule.seatsForSale ?? seatCapacity(seatMap)) - sold),
      segmentFare: fareForSegment(route.id, originStop.id, destinationStop.id) ?? 0,
      currency: schedule.currency,
      seatMap: {
        rows: seatMap?.rows ?? 11,
        columns: seatMap?.columns ?? ['A', 'B', '_', 'C', 'D'],
        layout: withBookedSeats(layoutFor(seatMap), bookedSeatIds),
        busModel: vehicle.model,
        busClass: vehicle.busClass,
        registrationNumber: vehicle.registrationNumber,
      },
      boardingPoints: schedule.boardingPoints,
      dropOffPoints: schedule.dropOffPoints,
    });
  }

  return trips;
}

export function getFerrySailings(): FerrySailing[] {
  return state.schedules
    .filter((schedule) => schedule.mode === 'ferry')
    .flatMap((schedule) => {
      const vessel = state.vessels.find((candidate) => candidate.id === schedule.vesselId);
      const route = state.routes.find((candidate) => candidate.id === schedule.routeId);
      const operator = operatorById(schedule.operatorId);
      if (!vessel || !route || !operator) return [];

      const sold = bookedSeats(schedule.id);
      const classes = vessel.classes.map((fareClass) => ({
        ...fareClass,
        availableCapacity: Math.max(0, fareClass.availableCapacity - sold.length),
      }));

      return [{
        id: schedule.id,
        operatorId: operator.id,
        operatorName: operator.name,
        operatorLogo: operator.logo,
        vesselName: vessel.name,
        departurePort: route.stops[0].name,
        arrivalPort: route.stops[route.stops.length - 1].name,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        departureDate: schedule.departureDate,
        arrivalDate: schedule.arrivalDate,
        duration: schedule.duration,
        classes,
      }];
    });
}

export function getBusTrip(id: string | null | undefined): BusTrip | undefined {
  if (!id) return undefined;
  return getBusTrips().find((trip) => trip.id === id);
}

export function getFerrySailing(id: string | null | undefined): FerrySailing | undefined {
  if (!id) return undefined;
  return getFerrySailings().find((sailing) => sailing.id === id);
}

export function addMinutes(time: string, minutes: number): string {
  const total = (minutesOf(time) + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─── Writes (operator console) ─────────────────────────────────────────────

export function updateRoute(routeId: string, patch: Partial<OpsRoute>) {
  setState({
    routes: state.routes.map((route) => (route.id === routeId ? { ...route, ...patch } : route)),
  });
}

export function addRoute(operatorId: string, mode: OpsMode, name: string): OpsRoute {
  const route: OpsRoute = {
    id: createId('route'),
    operatorId,
    mode,
    name,
    stops: [
      { id: createId('stop'), name: 'Origin', terminal: 'Origin terminal', offsetMinutes: 0 },
      { id: createId('stop'), name: 'Destination', terminal: 'Destination terminal', offsetMinutes: 120 },
    ],
    segmentFares: [],
  };
  setState({ routes: [...state.routes, route] });
  return route;
}

export function addStop(routeId: string, name: string, terminal: string, offsetMinutes: number) {
  setState({
    routes: state.routes.map((route) =>
      route.id === routeId
        ? {
            ...route,
            stops: [...route.stops, { id: createId('stop'), name, terminal, offsetMinutes }]
              .sort((a, b) => a.offsetMinutes - b.offsetMinutes),
          }
        : route,
    ),
  });
}

export function removeStop(routeId: string, stopId: string) {
  setState({
    routes: state.routes.map((route) =>
      route.id === routeId
        ? {
            ...route,
            stops: route.stops.filter((stop) => stop.id !== stopId),
            segmentFares: route.segmentFares.filter(
              (fare) => fare.fromStopId !== stopId && fare.toStopId !== stopId,
            ),
          }
        : route,
    ),
  });
}

export function setSegmentFare(routeId: string, fromStopId: string, toStopId: string, fare: number) {
  setState({
    routes: state.routes.map((route) => {
      if (route.id !== routeId) return route;
      const others = route.segmentFares.filter(
        (candidate) => !(candidate.fromStopId === fromStopId && candidate.toStopId === toStopId),
      );
      return { ...route, segmentFares: [...others, { fromStopId, toStopId, fare }] };
    }),
  });
}

export function removeSegmentFare(routeId: string, fromStopId: string, toStopId: string) {
  setState({
    routes: state.routes.map((route) =>
      route.id === routeId
        ? {
            ...route,
            segmentFares: route.segmentFares.filter(
              (candidate) => !(candidate.fromStopId === fromStopId && candidate.toStopId === toStopId),
            ),
          }
        : route,
    ),
  });
}

export function updateSeatMap(seatMapId: string, patch: Partial<SeatMapConfig>) {
  setState({
    seatMaps: state.seatMaps.map((map) => (map.id === seatMapId ? { ...map, ...patch } : map)),
  });
}

export function addSeatMap(operatorId: string, name: string, rows: number, columns: string[]): SeatMapConfig {
  const seatMap: SeatMapConfig = { id: createId('sm'), operatorId, name, rows, columns };
  setState({ seatMaps: [...state.seatMaps, seatMap] });
  return seatMap;
}

export function addVehicle(operatorId: string, input: Omit<OpsVehicle, 'id' | 'operatorId' | 'mileage' | 'lastService'>): OpsVehicle {
  const vehicle: OpsVehicle = {
    ...input,
    id: createId('veh'),
    operatorId,
    mileage: 0,
    lastService: new Date().toISOString().slice(0, 10),
  };
  setState({ vehicles: [...state.vehicles, vehicle] });
  return vehicle;
}

export function updateVehicle(vehicleId: string, patch: Partial<OpsVehicle>) {
  setState({
    vehicles: state.vehicles.map((vehicle) => (vehicle.id === vehicleId ? { ...vehicle, ...patch } : vehicle)),
  });
}

export function addVessel(operatorId: string, name: string, capacity: number): OpsVessel {
  const vessel: OpsVessel = {
    id: createId('vsl'),
    operatorId,
    name,
    capacity,
    status: 'active',
    lastInspection: new Date().toISOString().slice(0, 10),
    yearBuilt: new Date().getFullYear(),
    classes: [],
  };
  setState({ vessels: [...state.vessels, vessel] });
  return vessel;
}

export function updateVessel(vesselId: string, patch: Partial<OpsVessel>) {
  setState({
    vessels: state.vessels.map((vessel) => (vessel.id === vesselId ? { ...vessel, ...patch } : vessel)),
  });
}

export function upsertVesselClass(vesselId: string, fareClass: FerryVesselClass) {
  setState({
    vessels: state.vessels.map((vessel) => {
      if (vessel.id !== vesselId) return vessel;
      const others = vessel.classes.filter((candidate) => candidate.id !== fareClass.id);
      return {
        ...vessel,
        capacity: [...others, fareClass].reduce((sum, candidate) => sum + candidate.capacity, 0),
        classes: [...others, fareClass],
      };
    }),
  });
}

export function addSchedule(input: Omit<OpsSchedule, 'id'>): OpsSchedule {
  const schedule: OpsSchedule = { ...input, id: createId('sch') };
  setState({ schedules: [...state.schedules, schedule] });
  return schedule;
}

export function updateSchedule(scheduleId: string, patch: Partial<OpsSchedule>) {
  setState({
    schedules: state.schedules.map((schedule) =>
      schedule.id === scheduleId ? { ...schedule, ...patch } : schedule,
    ),
  });
}

export function removeSchedule(scheduleId: string) {
  setState({ schedules: state.schedules.filter((schedule) => schedule.id !== scheduleId) });
}

/** Counter (OTC) sale recorded at the operator desk. */
export function recordOtcSale(input: {
  operatorId: string;
  mode: OpsMode;
  scheduleId: string;
  customerName: string;
  customerPhone: string;
  seats: string[];
  amount: number;
  currency: string;
  classBooked?: string;
}): OpsBooking {
  const schedule = state.schedules.find((candidate) => candidate.id === input.scheduleId);
  const route = schedule ? state.routes.find((candidate) => candidate.id === schedule.routeId) : undefined;
  const booking: OpsBooking = {
    id: createId('bk'),
    reference: `OTC-${Date.now().toString(36).toUpperCase()}`,
    pnr: unusedPnr(),
    operatorId: input.operatorId,
    mode: input.mode,
    scheduleId: input.scheduleId,
    routeLabel: route?.name ?? 'Counter sale',
    date: schedule?.departureDate ?? new Date().toISOString().slice(0, 10),
    passengers: input.seats.length || 1,
    seats: input.seats,
    classBooked: input.classBooked,
    amount: input.amount,
    currency: input.currency,
    status: 'confirmed',
    channel: 'otc',
    soldBy: 'OTC desk',
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: '',
    bookedAt: new Date().toISOString(),
  };
  setState({ bookings: [booking, ...state.bookings] });
  return booking;
}

export function setBookingStatus(bookingId: string, status: OpsBooking['status']) {
  setState({
    bookings: state.bookings.map((booking) =>
      booking.id === bookingId
        ? { ...booking, status, amount: status === 'cancelled' || status === 'refunded' ? 0 : booking.amount }
        : booking,
    ),
  });
}

/** Online booking captured during the passenger flow. */
export function recordOnlineBooking(input: Omit<OpsBooking, 'id' | 'channel' | 'bookedAt' | 'status' | 'pnr'>): OpsBooking {
  const booking: OpsBooking = {
    ...input,
    id: createId('bk'),
    pnr: unusedPnr(),
    channel: 'online',
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
  };
  setState({ bookings: [booking, ...state.bookings] });
  return booking;
}

/**
 * Writes a completed passenger-side purchase back against the operator schedule, so
 * it shows up in the OIMS manifest, counts toward revenue and takes capacity. Returns
 * null when the purchased service is not a schedule the operator runs (stays, flights,
 * experiences), because there is no departure to attribute it to.
 */
export function recordBookingFromCheckout(input: {
  serviceId: string | null | undefined;
  reference: string;
  amount: number;
  currency: string;
  passengers: number;
  seats?: string[];
  classBooked?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}): OpsBooking | null {
  const schedule = input.serviceId
    ? state.schedules.find((candidate) => candidate.id === input.serviceId)
    : undefined;
  if (!schedule) return null;

  const route = state.routes.find((candidate) => candidate.id === schedule.routeId);
  const passengerCount = Math.max(1, input.passengers);

  return recordOnlineBooking({
    reference: input.reference,
    operatorId: schedule.operatorId,
    mode: schedule.mode,
    scheduleId: schedule.id,
    routeLabel: route?.name ?? 'Online booking',
    date: schedule.departureDate,
    passengers: passengerCount,
    seats: input.seats ?? [],
    classBooked: input.classBooked ?? undefined,
    amount: input.amount,
    currency: input.currency,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
  });
}

export function resolveOperatorForService(mode: OpsMode, serviceId: string | null | undefined): string | null {
  if (!serviceId) return null;
  const schedule = state.schedules.find((candidate) => candidate.id === serviceId);
  return schedule?.operatorId ?? null;
}

// ─── HQ (HIMS) ─────────────────────────────────────────────────────────────

export function setOperatorApproval(operatorId: string, hqApproved: boolean) {
  setState({
    operators: state.operators.map((operator) =>
      operator.id === operatorId ? { ...operator, hqApproved } : operator,
    ),
  });
}

export function networkSummary() {
  const activeOperators = state.operators.filter((operator) => operator.hqApproved).length;
  const confirmed = state.bookings.filter((booking) => booking.status === 'confirmed');
  return {
    operators: state.operators.length,
    activeOperators,
    routes: state.routes.length,
    schedules: state.schedules.length,
    bookings: state.bookings.length,
    confirmedBookings: confirmed.length,
    otcBookings: state.bookings.filter((booking) => booking.channel === 'otc').length,
    seatsSold: confirmed.reduce((sum, booking) => sum + booking.passengers, 0),
  };
}

export function routeLabel(routeId: string): string {
  return state.routes.find((route) => route.id === routeId)?.name ?? 'Unknown route';
}

export function scheduleById(scheduleId: string): OpsSchedule | undefined {
  return state.schedules.find((schedule) => schedule.id === scheduleId);
}

export function stopsOf(routeId: string): RouteStop[] {
  return state.routes.find((route) => route.id === routeId)?.stops ?? [];
}

/** Used by the booking flow: which stop does a passenger name map to? */
export function stopIdFor(routeId: string, stopName: string): string | null {
  const route = state.routes.find((candidate) => candidate.id === routeId);
  return route ? stopByName(route, stopName)?.id ?? null : null;
}
