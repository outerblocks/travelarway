import { useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  BUS_AMENITIES,
  addRoute,
  addSchedule,
  addSeatMap,
  addStop,
  addVehicle,
  addVessel,
  bookingsFor,
  createId,
  fareForSegment,
  removeSchedule,
  removeSegmentFare,
  removeStop,
  seatMapById,
  setBookingStatus,
  setSegmentFare,
  updateRoute,
  updateSchedule,
  updateSeatMap,
  updateVehicle,
  updateVessel,
  upsertVesselClass,
  recordOtcSale,
  type OpsMode,
  type OpsRoute,
  type OpsSchedule,
} from '@/data/operations';
import { useOperations } from '@/hooks/useOperations';
import type { FerryVesselClass } from '@/types';

/**
 * Operator (OIMS) management surfaces. Everything written here is immediately
 * visible to the passenger search, because both read the same operations store.
 */

const nf = (value: number, currency: string) =>
  currency === 'TZS' ? `TSh ${value.toLocaleString()}` : `$${value.toLocaleString()}`;

function SectionCard({ title, description, action, children }: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-neutral-600">
      <span className="block mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none';

// ─── Routes, stops and segment fares ───────────────────────────────────────

export function RoutesSection({ operatorId, mode }: { operatorId: string; mode: OpsMode }) {
  const ops = useOperations();
  const routes = ops.routes.filter((route) => route.operatorId === operatorId);
  const [selectedId, setSelectedId] = useState<string | null>(routes[0]?.id ?? null);
  const [newRouteName, setNewRouteName] = useState('');
  const [stopName, setStopName] = useState('');
  const [stopTerminal, setStopTerminal] = useState('');
  const [stopOffset, setStopOffset] = useState('120');
  const [fareFrom, setFareFrom] = useState('');
  const [fareTo, setFareTo] = useState('');
  const [fareValue, setFareValue] = useState('');

  const route: OpsRoute | undefined = routes.find((candidate) => candidate.id === selectedId) ?? routes[0];

  const createRoute = () => {
    if (!newRouteName.trim()) return;
    const created = addRoute(operatorId, mode, newRouteName.trim());
    setSelectedId(created.id);
    setNewRouteName('');
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title="Routes"
        description="A route is the ordered list of stops a service runs. Passengers search these stops."
        action={
          <div className="flex items-center gap-2">
            <input
              className={`${inputClass} w-52`}
              placeholder="Dar es Salaam → Morogoro"
              value={newRouteName}
              onChange={(event) => setNewRouteName(event.target.value)}
            />
            <button type="button" onClick={createRoute} className="btn-primary px-3 py-2 text-xs">
              <Plus size={14} /> Add route
            </button>
          </div>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {routes.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedId(candidate.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                candidate.id === route?.id ? 'border-brand-600 bg-brand-50' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <p className="text-sm font-semibold text-neutral-900">{candidate.name}</p>
              <p className="text-xs text-neutral-500">
                {candidate.stops.length} stops · {candidate.segmentFares.length} segment fares
              </p>
            </button>
          ))}
          {routes.length === 0 && (
            <p className="text-sm text-neutral-500">No routes yet. Add the first one to start selling.</p>
          )}
        </div>
      </SectionCard>

      {route && (
        <>
          <SectionCard title="Stops" description={`Ordered stops for ${route.name}. Times are minutes after departure.`}>
            <div className="space-y-3">
              <input
                className={inputClass}
                value={route.name}
                onChange={(event) => updateRoute(route.id, { name: event.target.value })}
                aria-label="Route name"
              />
              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {route.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-6 text-xs font-bold text-neutral-400">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-900">{stop.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {stop.terminal} · +{stop.offsetMinutes} min
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(route.id, stop.id)}
                      className="text-neutral-400 hover:text-error-600"
                      aria-label={`Remove ${stop.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_auto]">
                <Field label="Stop name">
                  <input className={inputClass} value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="Morogoro" />
                </Field>
                <Field label="Terminal">
                  <input className={inputClass} value={stopTerminal} onChange={(e) => setStopTerminal(e.target.value)} placeholder="Morogoro Bus Stand" />
                </Field>
                <Field label="Minutes after departure">
                  <input className={inputClass} type="number" min={0} value={stopOffset} onChange={(e) => setStopOffset(e.target.value)} />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn-secondary w-full px-3 py-2 text-xs"
                    onClick={() => {
                      if (!stopName.trim()) return;
                      addStop(route.id, stopName.trim(), stopTerminal.trim() || stopName.trim(), Number(stopOffset) || 0);
                      setStopName('');
                      setStopTerminal('');
                    }}
                  >
                    <Plus size={14} /> Add stop
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Segment fares" description="What a passenger pays between two stops. Falls back to the through fare.">
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                <Field label="From">
                  <select className={inputClass} value={fareFrom} onChange={(e) => setFareFrom(e.target.value)}>
                    <option value="">Select stop</option>
                    {route.stops.map((stop) => (
                      <option key={stop.id} value={stop.id}>{stop.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="To">
                  <select className={inputClass} value={fareTo} onChange={(e) => setFareTo(e.target.value)}>
                    <option value="">Select stop</option>
                    {route.stops.map((stop) => (
                      <option key={stop.id} value={stop.id}>{stop.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fare">
                  <input className={inputClass} type="number" min={0} value={fareValue} onChange={(e) => setFareValue(e.target.value)} />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn-primary w-full px-3 py-2 text-xs"
                    onClick={() => {
                      if (!fareFrom || !fareTo || fareFrom === fareTo) return;
                      setSegmentFare(route.id, fareFrom, fareTo, Number(fareValue) || 0);
                      setFareValue('');
                    }}
                  >
                    <Check size={14} /> Save fare
                  </button>
                </div>
              </div>

              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {route.segmentFares.map((fare) => {
                  const from = route.stops.find((stop) => stop.id === fare.fromStopId)?.name ?? '—';
                  const to = route.stops.find((stop) => stop.id === fare.toStopId)?.name ?? '—';
                  return (
                    <div key={`${fare.fromStopId}-${fare.toStopId}`} className="flex items-center gap-3 px-3 py-2">
                      <span className="flex-1 text-sm text-neutral-900">{from} → {to}</span>
                      <span className="text-sm font-semibold text-brand-600">{nf(fare.fare, 'TZS')}</span>
                      <button
                        type="button"
                        onClick={() => removeSegmentFare(route.id, fare.fromStopId, fare.toStopId)}
                        className="text-neutral-400 hover:text-error-600"
                        aria-label={`Remove fare ${from} to ${to}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
                {route.segmentFares.length === 0 && (
                  <p className="px-3 py-3 text-sm text-neutral-500">No segment fares yet. Add one above.</p>
                )}
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}

// ─── Schedules ─────────────────────────────────────────────────────────────

export function SchedulesSection({ operatorId, mode }: { operatorId: string; mode: OpsMode }) {
  const ops = useOperations();
  const routes = ops.routes.filter((route) => route.operatorId === operatorId);
  const vehicles = ops.vehicles.filter((vehicle) => vehicle.operatorId === operatorId);
  const vessels = ops.vessels.filter((vessel) => vessel.operatorId === operatorId);
  const schedules = ops.schedules.filter((schedule) => schedule.operatorId === operatorId);

  const [routeId, setRouteId] = useState(routes[0]?.id ?? '');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? '');
  const [vesselId, setVesselId] = useState(vessels[0]?.id ?? '');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().slice(0, 10));

  const add = () => {
    const route = routes.find((candidate) => candidate.id === routeId);
    if (!route) return;
    const lastStop = route.stops[route.stops.length - 1];
    const durationMinutes = lastStop?.offsetMinutes ?? 0;
    const arrival = addMinutes(departureTime, durationMinutes);
    const seats = mode === 'bus'
      ? (seatMapById(vehicles.find((v) => v.id === vehicleId)?.seatMapId ?? '')?.rows ?? 11) * 4
      : (vessels.find((v) => v.id === vesselId)?.capacity ?? 0);

    addSchedule({
      operatorId,
      mode,
      routeId: route.id,
      vehicleId: mode === 'bus' ? vehicleId : null,
      vesselId: mode === 'ferry' ? vesselId : null,
      departureTime,
      arrivalTime: arrival,
      duration: `${Math.floor(durationMinutes / 60)}h ${String(durationMinutes % 60).padStart(2, '0')}m`,
      departureDate,
      arrivalDate: departureDate,
      currency: mode === 'bus' ? 'TZS' : 'USD',
      status: 'scheduled',
      seatsForSale: seats,
      boardingPoints: [],
      dropOffPoints: [],
    });
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Publish a schedule" description="Schedules are the departures passengers can book.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Route">
            <select className={inputClass} value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
            </select>
          </Field>
          {mode === 'bus' ? (
            <Field label="Vehicle">
              <select className={inputClass} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} · {vehicle.model}</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Vessel">
              <select className={inputClass} value={vesselId} onChange={(e) => setVesselId(e.target.value)}>
                {vessels.map((vessel) => <option key={vessel.id} value={vessel.id}>{vessel.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Departure time">
            <input className={inputClass} type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
          </Field>
          <Field label="Departure date">
            <input className={inputClass} type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={add} className="btn-primary w-full px-3 py-2 text-xs">
              <Plus size={14} /> Add departure
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Published departures" description="Live on the public results page.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4">Route</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Departs</th>
                <th className="py-2 pr-4">Arrives</th>
                <th className="py-2 pr-4">Seats for sale</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => {
                const route = ops.routes.find((candidate) => candidate.id === schedule.routeId);
                return (
                  <tr key={schedule.id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-neutral-900">{route?.name ?? '—'}</td>
                    <td className="py-2 pr-4 text-neutral-600">{schedule.departureDate}</td>
                    <td className="py-2 pr-4 text-neutral-600">{schedule.departureTime}</td>
                    <td className="py-2 pr-4 text-neutral-600">{schedule.arrivalTime}</td>
                    <td className="py-2 pr-4 text-neutral-600">{schedule.seatsForSale ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <select
                        className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
                        value={schedule.status}
                        onChange={(event) =>
                          updateSchedule(schedule.id, { status: event.target.value as OpsSchedule['status'] })
                        }
                      >
                        {['scheduled', 'boarding', 'departed', 'completed', 'cancelled'].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeSchedule(schedule.id)}
                        className="text-neutral-400 hover:text-error-600"
                        aria-label="Remove departure"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = (hours * 60 + mins + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ─── Fleet, seat maps and vessel classes ───────────────────────────────────

export function FleetSection({ operatorId }: { operatorId: string }) {
  const ops = useOperations();
  const vehicles = ops.vehicles.filter((vehicle) => vehicle.operatorId === operatorId);
  const seatMaps = ops.seatMaps.filter((map) => map.operatorId === operatorId);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [busClass, setBusClass] = useState('AC Luxury VIP');
  const [seatMapId, setSeatMapId] = useState(seatMaps[0]?.id ?? '');
  const [seatMapName, setSeatMapName] = useState('');
  const [rows, setRows] = useState('11');
  const [columns, setColumns] = useState('A,B,_,C,D');

  return (
    <div className="space-y-6">
      <SectionCard title="Vehicles" description="Fleet details drive the bus class, amenities and seat map on the result card.">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Registration">
              <input className={inputClass} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="T 123 ABC" />
            </Field>
            <Field label="Model">
              <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Yutong F12" />
            </Field>
            <Field label="Class">
              <input className={inputClass} value={busClass} onChange={(e) => setBusClass(e.target.value)} />
            </Field>
            <Field label="Seat map">
              <select className={inputClass} value={seatMapId} onChange={(e) => setSeatMapId(e.target.value)}>
                {seatMaps.map((map) => <option key={map.id} value={map.id}>{map.name}</option>)}
              </select>
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="btn-primary w-full px-3 py-2 text-xs"
                onClick={() => {
                  if (!plate.trim() || !model.trim()) return;
                  addVehicle(operatorId, {
                    registrationNumber: plate.trim(),
                    model: model.trim(),
                    busClass,
                    seatMapId,
                    amenities: ['Air Conditioning', 'USB Charging'],
                    status: 'active',
                  });
                  setPlate('');
                  setModel('');
                }}
              >
                <Plus size={14} /> Add vehicle
              </button>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">{vehicle.registrationNumber}</span>
                  <span className="text-xs text-neutral-500">{vehicle.model} · {vehicle.busClass}</span>
                  <select
                    className="ml-auto rounded-md border border-neutral-200 px-2 py-1 text-xs"
                    value={vehicle.status}
                    onChange={(event) => updateVehicle(vehicle.id, { status: event.target.value as typeof vehicle.status })}
                  >
                    {['active', 'maintenance', 'retired'].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BUS_AMENITIES.map((amenity) => {
                    const enabled = vehicle.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() =>
                          updateVehicle(vehicle.id, {
                            amenities: enabled
                              ? vehicle.amenities.filter((item) => item !== amenity)
                              : [...vehicle.amenities, amenity],
                          })
                        }
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          enabled ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Seat maps" description="Seat layout used by the seat picker. `_` marks the aisle.">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_6rem_1fr_auto]">
            <Field label="Seat map name">
              <input
                className={inputClass}
                placeholder="Yutong F12 · 11 rows"
                value={seatMapName}
                onChange={(event) => setSeatMapName(event.target.value)}
              />
            </Field>
            <Field label="Rows">
              <input className={inputClass} value={rows} onChange={(e) => setRows(e.target.value)} type="number" min={1} />
            </Field>
            <Field label="Columns (comma separated)">
              <input className={inputClass} value={columns} onChange={(e) => setColumns(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="btn-primary w-full px-3 py-2 text-xs"
                onClick={() => {
                  addSeatMap(
                    operatorId,
                    seatMapName.trim() || `Coach · ${rows} rows`,
                    Number(rows) || 11,
                    columns.split(',').map((column) => column.trim()).filter(Boolean),
                  );
                  setSeatMapName('');
                }}
              >
                <Plus size={14} /> Add seat map
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {seatMaps.map((map) => (
              <div key={map.id} className="rounded-lg border border-neutral-200 p-3">
                <p className="text-sm font-semibold text-neutral-900">{map.name}</p>
                <p className="text-xs text-neutral-500">{map.rows} rows · columns {map.columns.join(' ')}</p>
                <div className="mt-2 flex items-end gap-2">
                  <Field label="Rows">
                    <input
                      className={`${inputClass} w-20`}
                      type="number"
                      min={1}
                      value={map.rows}
                      onChange={(event) => updateSeatMap(map.id, { rows: Number(event.target.value) || 1 })}
                    />
                  </Field>
                  <Field label="Columns">
                    <input
                      className={inputClass}
                      value={map.columns.join(',')}
                      onChange={(event) =>
                        updateSeatMap(map.id, {
                          columns: event.target.value.split(',').map((column) => column.trim()).filter(Boolean),
                        })
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export function VesselsSection({ operatorId }: { operatorId: string }) {
  const ops = useOperations();
  const vessels = ops.vessels.filter((vessel) => vessel.operatorId === operatorId);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('300');

  return (
    <div className="space-y-6">
      <SectionCard title="Vessels" description="Each vessel owns its classes, capacities and fares.">
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
            <Field label="Vessel name">
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Kilimanjaro IX" />
            </Field>
            <Field label="Capacity">
              <input className={inputClass} type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="btn-primary w-full px-3 py-2 text-xs"
                onClick={() => {
                  if (!name.trim()) return;
                  addVessel(operatorId, name.trim(), Number(capacity) || 0);
                  setName('');
                }}
              >
                <Plus size={14} /> Add vessel
              </button>
            </div>
          </div>

          {vessels.map((vessel) => (
            <div key={vessel.id} className="rounded-lg border border-neutral-200">
              <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-3 py-2">
                <span className="text-sm font-semibold text-neutral-900">{vessel.name}</span>
                <span className="text-xs text-neutral-500">{vessel.capacity} seats</span>
                <select
                  className="ml-auto rounded-md border border-neutral-200 px-2 py-1 text-xs"
                  value={vessel.status}
                  onChange={(event) => updateVessel(vessel.id, { status: event.target.value as typeof vessel.status })}
                >
                  {['active', 'maintenance', 'dry_dock'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <ClassEditor vesselId={vessel.id} classes={vessel.classes} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ClassEditor({ vesselId, classes }: { vesselId: string; classes: FerryVesselClass[] }) {
  const [draft, setDraft] = useState({
    name: '',
    capacity: '50',
    adultFare: '35',
    childFare: '20',
    residentAdultFare: '35000',
    residentChildFare: '20000',
  });
  const number = (value: string) => Number(value) || 0;

  return (
    <div className="p-3">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-neutral-500">
            <th className="py-1 pr-3">Class</th>
            <th className="py-1 pr-3">Capacity</th>
            <th className="py-1 pr-3">Adult (USD)</th>
            <th className="py-1 pr-3">Child (USD)</th>
            <th className="py-1 pr-3">Adult (TZS)</th>
            <th className="py-1 pr-3">Child (TZS)</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((fareClass) => (
            <tr key={fareClass.id} className="border-t border-neutral-100">
              <td className="py-1 pr-3 font-medium text-neutral-900">{fareClass.name}</td>
              <td className="py-1 pr-3">
                <input
                  className="w-20 rounded border border-neutral-200 px-2 py-1"
                  type="number"
                  value={fareClass.capacity}
                  onChange={(event) =>
                    upsertVesselClass(vesselId, { ...fareClass, capacity: Number(event.target.value) || 0 })
                  }
                />
              </td>
              <td className="py-1 pr-3">
                <input
                  className="w-20 rounded border border-neutral-200 px-2 py-1"
                  type="number"
                  value={fareClass.adultFare}
                  onChange={(event) =>
                    upsertVesselClass(vesselId, { ...fareClass, adultFare: Number(event.target.value) || 0 })
                  }
                />
              </td>
              <td className="py-1 pr-3">
                <input
                  className="w-20 rounded border border-neutral-200 px-2 py-1"
                  type="number"
                  value={fareClass.childFare}
                  onChange={(event) =>
                    upsertVesselClass(vesselId, { ...fareClass, childFare: Number(event.target.value) || 0 })
                  }
                />
              </td>
              <td className="py-1 pr-3">
                <input
                  className="w-24 rounded border border-neutral-200 px-2 py-1"
                  type="number"
                  value={fareClass.residentAdultFare}
                  onChange={(event) =>
                    upsertVesselClass(vesselId, { ...fareClass, residentAdultFare: Number(event.target.value) || 0 })
                  }
                />
              </td>
              <td className="py-1 pr-3">
                <input
                  className="w-24 rounded border border-neutral-200 px-2 py-1"
                  type="number"
                  value={fareClass.residentChildFare}
                  onChange={(event) =>
                    upsertVesselClass(vesselId, { ...fareClass, residentChildFare: Number(event.target.value) || 0 })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <input
          className={`${inputClass} w-32`}
          placeholder="Class name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <input
          className={`${inputClass} w-20`}
          type="number"
          value={draft.capacity}
          onChange={(event) => setDraft({ ...draft, capacity: event.target.value })}
        />
        <input
          className={`${inputClass} w-20`}
          type="number"
          value={draft.adultFare}
          onChange={(event) => setDraft({ ...draft, adultFare: event.target.value })}
        />
        <input
          className={`${inputClass} w-20`}
          type="number"
          value={draft.childFare}
          onChange={(event) => setDraft({ ...draft, childFare: event.target.value })}
        />
        <input
          className={`${inputClass} w-28`}
          type="number"
          value={draft.residentAdultFare}
          onChange={(event) => setDraft({ ...draft, residentAdultFare: event.target.value })}
        />
        <input
          className={`${inputClass} w-28`}
          type="number"
          value={draft.residentChildFare}
          onChange={(event) => setDraft({ ...draft, residentChildFare: event.target.value })}
        />
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          onClick={() => {
            if (!draft.name.trim()) return;
            const capacity = number(draft.capacity);
            upsertVesselClass(vesselId, {
              id: createId('fc'),
              name: draft.name.trim(),
              capacity,
              availableCapacity: capacity,
              adultFare: number(draft.adultFare),
              childFare: number(draft.childFare),
              // Residents are charged in TZS; the operator sets that fare, it is not
              // derived from the non-resident price.
              residentAdultFare: number(draft.residentAdultFare),
              residentChildFare: number(draft.residentChildFare),
              currency: 'USD',
              description: `${draft.name.trim()} class`,
            });
            setDraft({
              name: '',
              capacity: '50',
              adultFare: '35',
              childFare: '20',
              residentAdultFare: '35000',
              residentChildFare: '20000',
            });
          }}
        >
          <Plus size={14} /> Add class
        </button>
      </div>
    </div>
  );
}

// ─── Manifest and OTC sales ────────────────────────────────────────────────

export function ManifestSection({ operatorId, mode }: { operatorId: string; mode: OpsMode }) {
  const ops = useOperations();
  const schedules = ops.schedules.filter((schedule) => schedule.operatorId === operatorId);
  const [scheduleId, setScheduleId] = useState(schedules[0]?.id ?? '');
  const bookings = bookingsFor(operatorId).filter((booking) => booking.scheduleId === scheduleId);
  const schedule = schedules.find((candidate) => candidate.id === scheduleId);
  const route = schedule ? ops.routes.find((candidate) => candidate.id === schedule.routeId) : undefined;

  const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
  const seatsSold = confirmed.reduce((sum, booking) => sum + booking.passengers, 0);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [seats, setSeats] = useState('1A');
  const [amount, setAmount] = useState('');

  const throughFare = useMemo(() => {
    if (!route) return 0;
    return fareForSegment(route.id, route.stops[0]?.id ?? '', route.stops[route.stops.length - 1]?.id ?? '') ?? 0;
  }, [route]);

  return (
    <div className="space-y-6">
      <SectionCard
        title="Manifest"
        description="Passengers travelling on a departure. Online and counter sales appear together."
        action={
          <select className={`${inputClass} w-72`} value={scheduleId} onChange={(event) => setScheduleId(event.target.value)}>
            {schedules.map((candidate) => {
              const candidateRoute = ops.routes.find((item) => item.id === candidate.routeId);
              return (
                <option key={candidate.id} value={candidate.id}>
                  {candidateRoute?.name ?? candidate.id} · {candidate.departureDate} {candidate.departureTime}
                </option>
              );
            })}
          </select>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 p-3">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Bookings</p>
            <p className="text-lg font-bold text-neutral-900">{bookings.length}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-3">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Confirmed</p>
            <p className="text-lg font-bold text-neutral-900">{confirmed.length}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-3">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">Seats sold</p>
            <p className="text-lg font-bold text-neutral-900">{seatsSold}</p>
          </div>
          <div className="rounded-lg border border-neutral-200 p-3">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">OTC sales</p>
            <p className="text-lg font-bold text-neutral-900">{bookings.filter((b) => b.channel === 'otc').length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">Passenger</th>
                <th className="py-2 pr-4">Seats</th>
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs text-neutral-600">
                    {booking.reference}
                    {/* The traveller quotes the network PNR, so the desk needs to see it. */}
                    <p className="text-[11px] text-neutral-500">{booking.pnr}</p>
                  </td>
                  <td className="py-2 pr-4">
                    <p className="font-medium text-neutral-900">{booking.customerName}</p>
                    <p className="text-xs text-neutral-500">{booking.customerPhone || booking.customerEmail}</p>
                  </td>
                  <td className="py-2 pr-4 text-neutral-600">{booking.seats.join(', ') || '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      booking.channel === 'otc' ? 'bg-warning-50 text-warning-700' : 'bg-brand-50 text-brand-700'
                    }`}>
                      {booking.channel === 'otc' ? 'OTC' : 'Online'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-neutral-600">{nf(booking.amount, booking.currency)}</td>
                  <td className="py-2 pr-4">
                    <select
                      className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
                      value={booking.status}
                      onChange={(event) => setBookingStatus(booking.id, event.target.value as typeof booking.status)}
                    >
                      {['confirmed', 'pending', 'cancelled', 'refunded'].map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-sm text-neutral-500">No bookings on this departure yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Sell at the counter (OTC)" description="Record a walk-up sale against this departure.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Customer name">
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+255 7.." />
          </Field>
          <Field label="Seats">
            <input className={inputClass} value={seats} onChange={(event) => setSeats(event.target.value)} placeholder="1A, 1B" />
          </Field>
          <Field label="Amount">
            <input
              className={inputClass}
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={String(throughFare)}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-primary w-full px-3 py-2 text-xs"
              onClick={() => {
                if (!name.trim() || !scheduleId) return;
                recordOtcSale({
                  operatorId,
                  mode,
                  scheduleId,
                  customerName: name.trim(),
                  customerPhone: phone.trim(),
                  seats: seats.split(',').map((seat) => seat.trim().toUpperCase()).filter(Boolean),
                  amount: Number(amount) || throughFare,
                  currency: schedule?.currency ?? 'TZS',
                });
                setName('');
                setPhone('');
                setAmount('');
              }}
            >
              <Check size={14} /> Record sale
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
