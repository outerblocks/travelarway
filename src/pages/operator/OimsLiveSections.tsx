import { useState } from 'react';
import { AMENITY_KEYS, AMENITY_LABELS, type AmenityKey } from '@/domain/amenities';
import { AmenityIcon } from '@/components/shared/AmenityIcon';
import { OimsSeatMapDesigner } from '@/pages/operator/OimsSeatMapDesigner';

type FleetVehicle = {
  id: string;
  registration: string;
  model?: string | null;
  classLabel?: string | null;
  serviceClass: string | null;
  amenities?: string[];
  seatLayoutId?: string | null;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-neutral-600">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-brand-500 focus:outline-none';

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((payload as { error?: string }).error ?? 'request_failed');
  return payload;
}

function VehicleEditor({
  vehicle,
  onChanged,
  onError,
}: {
  vehicle: FleetVehicle;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [model, setModel] = useState(vehicle.model ?? '');
  const [classLabel, setClassLabel] = useState(vehicle.classLabel ?? '');
  const [serviceClass, setServiceClass] = useState(vehicle.serviceClass ?? '');
  const [amenities, setAmenities] = useState<AmenityKey[]>(
    (vehicle.amenities ?? []).filter((item): item is AmenityKey => AMENITY_KEYS.includes(item as AmenityKey)),
  );

  const toggle = (key: AmenityKey) => {
    setAmenities((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  return (
    <li className="py-3">
      <p className="text-sm font-semibold text-neutral-900">
        {vehicle.registration}
        {vehicle.seatLayoutId ? ' · map assigned' : ' · no map'}
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <input className={inputClass} value={model} onChange={(event) => setModel(event.target.value)} placeholder="Coach model" />
        <input className={inputClass} value={classLabel} onChange={(event) => setClassLabel(event.target.value)} placeholder="Service label" />
        <select className={inputClass} value={serviceClass} onChange={(event) => setServiceClass(event.target.value)}>
          <option value="">LATRA class not stated</option>
          <option value="ordinary">Ordinary</option>
          <option value="semi_luxury">Semi-luxury</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {AMENITY_KEYS.map((key) => {
          const on = amenities.includes(key);
          return (
            <button
              key={key}
              type="button"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${
                on ? 'bg-ink text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
              onClick={() => toggle(key)}
            >
              <AmenityIcon amenity={key} />
              {AMENITY_LABELS[key].en}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn-secondary mt-2 text-xs"
        onClick={() => {
          onError('');
          void postJson('/api/oims/fleet', {
            mode: 'bus',
            action: 'update',
            vehicleId: vehicle.id,
            model,
            classLabel,
            serviceClass: serviceClass || null,
            amenities,
          }).then(onChanged).catch((caught: Error) => onError(caught.message));
        }}
      >
        Save fleet facts
      </button>
    </li>
  );
}

export function CompliancePanel({
  mode,
  operator,
  onSaved,
}: {
  mode: 'bus' | 'ferry';
  operator: {
    latraLicenceNumber: string | null;
    tasacLicenceNumber: string | null;
    electronicTicketingRegistered: boolean;
    licenceValidTo: string | null;
    passengerCertificateMax: number | null;
  };
  onSaved: () => void;
}) {
  const [latra, setLatra] = useState(operator.latraLicenceNumber ?? '');
  const [tasac, setTasac] = useState(operator.tasacLicenceNumber ?? '');
  const [ets, setEts] = useState(operator.electronicTicketingRegistered);
  const [validTo, setValidTo] = useState(operator.licenceValidTo ?? '');
  const [cap, setCap] = useState(String(operator.passengerCertificateMax ?? ''));
  const [error, setError] = useState('');

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-bold text-neutral-900">Regulatory readiness</h2>
      <p className="mt-1 text-xs text-neutral-500">
        LATRA PSV Regulations 2020 require a licence and Authority-approved electronic ticketing before
        a bus service is published. Ferry capacity cannot exceed the Certificate of Seaworthiness.
        Staff invitations stay blocked until the identity provider is live.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {mode === 'bus' ? (
          <Field label="LATRA licence number">
            <input className={inputClass} value={latra} onChange={(event) => setLatra(event.target.value)} />
          </Field>
        ) : (
          <Field label="TASAC / ferry licence number">
            <input className={inputClass} value={tasac} onChange={(event) => setTasac(event.target.value)} />
          </Field>
        )}
        <Field label="Licence valid to">
          <input className={inputClass} type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
        </Field>
        {mode === 'bus' ? (
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input type="checkbox" checked={ets} onChange={(event) => setEts(event.target.checked)} />
            Registered to LATRA-approved electronic ticketing
          </label>
        ) : (
          <Field label="Passenger certificate maximum">
            <input className={inputClass} type="number" min={1} value={cap} onChange={(event) => setCap(event.target.value)} />
          </Field>
        )}
      </div>
      {error ? <p className="mt-2 text-sm text-error-600">{error}</p> : null}
      <button
        type="button"
        className="btn-primary mt-4 px-4 py-2 text-xs"
        onClick={() => {
          setError('');
          void postJson('/api/oims/compliance', {
            mode,
            latraLicenceNumber: latra || null,
            tasacLicenceNumber: tasac || null,
            electronicTicketingRegistered: ets,
            licenceValidTo: validTo || null,
            passengerCertificateMax: cap ? Number(cap) : null,
          }).then(onSaved).catch((caught: Error) => setError(caught.message));
        }}
      >
        Save compliance
      </button>
    </section>
  );
}

export function LiveRoutesSection({
  mode,
  routes,
  onChanged,
}: {
  mode: 'bus' | 'ferry';
  routes: {
    id: string;
    name: string;
    stops: { id: string; locationName: string; sequence: number }[];
    fares?: { fromStopId: string; toStopId: string; fareMinor: number; currency: string }[];
  }[];
  onChanged: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0]?.id ?? '');
  const selected = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const [fromStopId, setFromStopId] = useState(selected?.stops[0]?.id ?? '');
  const [toStopId, setToStopId] = useState(selected?.stops[1]?.id ?? '');
  const [fareMinor, setFareMinor] = useState('');

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-bold text-neutral-900">Routes and segment fares</h2>
      <p className="mt-1 text-xs text-neutral-500">
        A route is an ordered corridor, not a dated departure. Stops come from the location
        register. A segment fare is required before trips can be published.
      </p>
      <div className="mt-4 flex gap-2">
        <input className={inputClass} placeholder="Dar es Salaam → Morogoro" value={name} onChange={(event) => setName(event.target.value)} />
        <button
          type="button"
          className="btn-primary px-3 py-2 text-xs"
          onClick={() => {
            setError('');
            void postJson('/api/oims/routes', { mode, name }).then(() => {
              setName('');
              onChanged();
            }).catch((caught: Error) => setError(caught.message));
          }}
        >
          Add route
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Route to edit">
          <select className={inputClass} value={selected?.id ?? ''} onChange={(event) => setSelectedRouteId(event.target.value)}>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </select>
        </Field>
        <Field label="Find stop in register">
          <div className="flex gap-2">
            <input className={inputClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'ferry' ? 'Port or terminal' : 'Town or city'} />
            <button
              type="button"
              className="btn-secondary px-3 py-2 text-xs"
              onClick={() => {
                setError('');
                void fetch(`/api/locations?mode=${mode}&q=${encodeURIComponent(query)}`)
                  .then(async (response) => {
                    const body = await response.json() as { data?: { id: string; name: string; code: string }[] };
                    if (!response.ok) throw new Error('locations_unavailable');
                    setHits(body.data ?? []);
                  })
                  .catch((caught: Error) => setError(caught.message));
              }}
            >
              Search
            </button>
          </div>
        </Field>
      </div>
      {hits.length > 0 && selected ? (
        <ul className="mt-2 divide-y divide-neutral-100 rounded-md border border-neutral-200">
          {hits.slice(0, 8).map((hit) => (
            <li key={hit.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{hit.name} · {hit.code}</span>
              <button
                type="button"
                className="text-xs font-semibold text-brand-700"
                onClick={() => {
                  setError('');
                  void postJson('/api/oims/routes', {
                    mode,
                    action: 'stop',
                    routeId: selected.id,
                    locationId: hit.id,
                    offsetMinutes: (selected.stops.length) * 60,
                  }).then(() => {
                    setHits([]);
                    onChanged();
                  }).catch((caught: Error) => setError(caught.message));
                }}
              >
                Add stop
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {selected && selected.stops.length >= 2 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="From stop">
            <select className={inputClass} value={fromStopId} onChange={(event) => setFromStopId(event.target.value)}>
              {selected.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.locationName}</option>)}
            </select>
          </Field>
          <Field label="To stop">
            <select className={inputClass} value={toStopId} onChange={(event) => setToStopId(event.target.value)}>
              {selected.stops.map((stop) => <option key={stop.id} value={stop.id}>{stop.locationName}</option>)}
            </select>
          </Field>
          <Field label={mode === 'bus' ? 'Fare (TZS)' : 'Fare (USD)'}>
            <div className="flex gap-2">
              <input className={inputClass} inputMode="numeric" value={fareMinor} onChange={(event) => setFareMinor(event.target.value)} />
              <button
                type="button"
                className="btn-primary px-3 py-2 text-xs"
                onClick={() => {
                  setError('');
                  void postJson('/api/oims/routes', {
                    mode,
                    action: 'fare',
                    routeId: selected.id,
                    fromStopId,
                    toStopId,
                    fareMinor: Number(fareMinor),
                  }).then(onChanged).catch((caught: Error) => setError(caught.message));
                }}
              >
                Save fare
              </button>
            </div>
          </Field>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-error-600">{error}</p> : null}
      <ul className="mt-4 divide-y divide-neutral-100">
        {routes.map((route) => (
          <li key={route.id} className="py-3">
            <p className="text-sm font-semibold text-neutral-900">{route.name}</p>
            <p className="text-xs text-neutral-500">
              {route.stops.map((stop) => stop.locationName).join(' → ') || 'No stops yet'}
              {route.fares?.length ? ` · ${route.fares.length} fare(s)` : ' · no segment fare'}
            </p>
          </li>
        ))}
        {routes.length === 0 ? <li className="py-3 text-sm text-neutral-500">No routes in PostgreSQL yet.</li> : null}
      </ul>
    </section>
  );
}

export function LiveSchedulesSection({
  mode,
  routes,
  vehicles,
  vessels,
  trips,
  onChanged,
}: {
  mode: 'bus' | 'ferry';
  routes: { id: string; name: string }[];
  vehicles: { id: string; registration: string }[];
  vessels: { id: string; name: string }[];
  trips: { id: string; serviceDate: string; status: string; scheduleId: string }[];
  onChanged: () => void;
}) {
  const [routeId, setRouteId] = useState(routes[0]?.id ?? '');
  const [departureTime, setDepartureTime] = useState('06:00');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState('');
  const [preview, setPreview] = useState<{ count: number; dates: string[]; blocks: string[]; canCommit: boolean } | null>(null);
  const [error, setError] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const body = {
    mode,
    routeId,
    departureTime,
    daysOfWeek,
    validFrom,
    validTo,
    vehicleId: vehicles[0]?.id,
    vesselId: vessels[0]?.id,
  };

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-bold text-neutral-900">Recurring schedule</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Preview dated trip instances before they are written. Rerunning the same rule cannot duplicate a service date.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Route">
          <select className={inputClass} value={routeId} onChange={(event) => setRouteId(event.target.value)}>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
          </select>
        </Field>
        <Field label="Local departure">
          <input className={inputClass} type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} />
        </Field>
        <Field label="From">
          <input className={inputClass} type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
        </Field>
        <Field label="Through">
          <input className={inputClass} type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, day) => (
          <label key={label} className="flex items-center gap-1 text-neutral-700">
            <input
              type="checkbox"
              checked={daysOfWeek.includes(day)}
              onChange={(event) => {
                setDaysOfWeek((current) => (
                  event.target.checked ? [...current, day] : current.filter((value) => value !== day)
                ));
              }}
            />
            {label}
          </label>
        ))}
      </div>
      {preview ? (
        <p className="mt-3 text-sm text-neutral-700">
          {preview.count} occurrences. {preview.canCommit ? 'Ready to commit.' : `Blocked: ${preview.blocks.join(', ')}`}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-error-600">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          onClick={() => {
            setError('');
            void postJson('/api/oims/schedules', { ...body, action: 'preview' })
              .then((row) => setPreview(row as typeof preview))
              .catch((caught: Error) => setError(caught.message));
          }}
        >
          Preview
        </button>
        <button
          type="button"
          className="btn-primary px-3 py-2 text-xs"
          disabled={!preview?.canCommit}
          onClick={() => {
            setError('');
            void postJson('/api/oims/schedules', { ...body, action: 'commit' })
              .then(onChanged)
              .catch((caught: Error) => setError(caught.message));
          }}
        >
          Generate trips
        </button>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">Upcoming trip instances</p>
      <ul className="mt-2 divide-y divide-neutral-100">
        {trips.slice(0, 12).map((trip) => (
          <li key={trip.id} className="flex justify-between py-2 text-sm">
            <span>{trip.serviceDate}</span>
            <span className="text-neutral-500">{trip.status}</span>
          </li>
        ))}
        {trips.length === 0 ? <li className="py-2 text-sm text-neutral-500">No generated trips.</li> : null}
      </ul>
    </section>
  );
}

export function LiveFleetSection({
  mode,
  vehicles,
  vessels,
  onChanged,
}: {
  mode: 'bus' | 'ferry';
  vehicles: FleetVehicle[];
  vessels: { id: string; name: string; passengerCertificateMax: number; classes?: { id: string; name: string; capacity: number }[] }[];
  onChanged: () => void;
}) {
  const [registration, setRegistration] = useState('');
  const [model, setModel] = useState('');
  const [classLabel, setClassLabel] = useState('');
  const [name, setName] = useState('');
  const [cap, setCap] = useState('80');
  const [className, setClassName] = useState('Economy');
  const [classCap, setClassCap] = useState('40');
  const [classFare, setClassFare] = useState('3500');
  const [error, setError] = useState('');
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-bold text-neutral-900">{mode === 'bus' ? 'Fleet' : 'Vessels'}</h2>
      {mode === 'bus' ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <input className={inputClass} placeholder="T 123 ABC" value={registration} onChange={(event) => setRegistration(event.target.value)} />
          <input className={inputClass} placeholder="Yutong F12" value={model} onChange={(event) => setModel(event.target.value)} />
          <input className={inputClass} placeholder="AC Luxury VIP" value={classLabel} onChange={(event) => setClassLabel(event.target.value)} />
        </div>
        <button
          type="button"
          className="btn-primary mt-2 px-3 py-2 text-xs"
          onClick={() => {
            setError('');
            void postJson('/api/oims/fleet', { mode, registration, model, classLabel }).then(() => {
              setRegistration('');
              setModel('');
              setClassLabel('');
              onChanged();
            }).catch((caught: Error) => setError(caught.message));
          }}
        >
          Add vehicle
        </button>
      ) : (
        <div className="mt-4 flex gap-2">
          <input className={inputClass} placeholder="Vessel name" value={name} onChange={(event) => setName(event.target.value)} />
          <input className={`${inputClass} w-28`} type="number" value={cap} onChange={(event) => setCap(event.target.value)} />
          <button
            type="button"
            className="btn-primary px-3 py-2 text-xs"
            onClick={() => {
              setError('');
              void postJson('/api/oims/fleet', { mode, name, passengerCertificateMax: Number(cap) }).then(() => {
                setName('');
                onChanged();
              }).catch((caught: Error) => setError(caught.message));
            }}
          >
            Add vessel
          </button>
        </div>
      )}
      {mode === 'ferry' && vessels[0] ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input className={inputClass} value={className} onChange={(event) => setClassName(event.target.value)} placeholder="Class name" />
          <input className={inputClass} type="number" value={classCap} onChange={(event) => setClassCap(event.target.value)} />
          <input className={inputClass} type="number" value={classFare} onChange={(event) => setClassFare(event.target.value)} />
          <button
            type="button"
            className="btn-secondary px-3 py-2 text-xs"
            onClick={() => {
              setError('');
              void postJson('/api/oims/fleet', {
                mode,
                action: 'class',
                vesselId: vessels[0].id,
                name: className,
                capacity: Number(classCap),
                adultFareMinor: Number(classFare),
              }).then(onChanged).catch((caught: Error) => setError(caught.message));
            }}
          >
            Add class
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-error-600">{error}</p> : null}
      <ul className="mt-4 divide-y divide-neutral-100">
        {mode === 'bus'
          ? vehicles.map((vehicle) => (
            <VehicleEditor key={vehicle.id} vehicle={vehicle} onChanged={onChanged} onError={setError} />
          ))
          : vessels.map((vessel) => (
            <li key={vessel.id} className="py-2 text-sm">
              {vessel.name} · cert max {vessel.passengerCertificateMax}
              {vessel.classes?.length ? ` · ${vessel.classes.map((row) => `${row.name} ${row.capacity}`).join(', ')}` : ' · no classes'}
            </li>
          ))}
      </ul>
      {mode === 'bus' ? <OimsSeatMapDesigner vehicles={vehicles} onChanged={onChanged} /> : null}
    </section>
  );
}

export function LiveManifestSection({
  mode,
  trips,
}: {
  mode: 'bus' | 'ferry';
  trips: { id: string; serviceDate: string }[];
}) {
  const [tripId, setTripId] = useState(trips[0]?.id ?? '');
  const [document, setDocument] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-bold text-neutral-900">Passenger manifest</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Bus: LATRA Fourth Schedule (police, office, vehicle copies; retain 5 years). Ferry: passenger list snapshot.
        Issue records the copies. It does not file with police or TASAC Maritime Single Window.
      </p>
      <select className={`${inputClass} mt-4`} value={tripId} onChange={(event) => setTripId(event.target.value)}>
        {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.serviceDate}</option>)}
      </select>
      {error ? <p className="mt-2 text-sm text-error-600">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-xs"
          disabled={!tripId}
          onClick={() => {
            setError('');
            void fetch(`/api/oims/manifests/${tripId}?mode=${mode}`, { credentials: 'same-origin' })
              .then(async (response) => {
                const payload = await response.json();
                if (!response.ok) throw new Error(payload.error ?? 'load_failed');
                setDocument(payload);
              })
              .catch((caught: Error) => setError(caught.message));
          }}
        >
          Load manifest
        </button>
        <button
          type="button"
          className="btn-primary px-3 py-2 text-xs"
          disabled={!tripId}
          onClick={() => {
            setError('');
            void postJson(`/api/oims/manifests/${tripId}`, { mode })
              .then((payload) => setDocument(payload as Record<string, unknown>))
              .catch((caught: Error) => setError(caught.message));
          }}
        >
          Issue copies
        </button>
      </div>
      {document ? (
        <pre className="mt-4 overflow-auto rounded bg-neutral-50 p-3 text-xs text-neutral-800">
          {JSON.stringify(document, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
