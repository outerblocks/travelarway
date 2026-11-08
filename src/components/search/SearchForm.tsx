import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@/router';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { DatePicker } from '@/components/ui/DatePicker';
import { PassengerCounter } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { todayISO, addDays, generateId } from '@/utils/format';
import type { BookingMode, SearchParams } from '@/types';

/** How each non-settlement kind is described under a place name in the picker. */
const PLACE_KIND_LABELS: Record<string, string> = {
  station: 'Railway station',
  port: 'Ferry port',
  terminal: 'Bus terminal',
  airport: 'Airport',
  property: 'Property',
};

function countryLabel(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function optionFromLocation(location: {
  id: string;
  name: string;
  kind: string;
  region: string | null;
  countryCode: string;
  code?: string;
}) {
  const country = countryLabel(location.countryCode);
  return {
    id: location.id,
    name: location.name,
    subText:
      location.kind === 'city' || location.kind === 'town'
        ? [location.kind === 'town' ? 'Town' : 'City', country].filter(Boolean).join(' · ')
        : location.kind === 'airport'
          ? ['Airport', country, location.code].filter(Boolean).join(' · ')
          : [PLACE_KIND_LABELS[location.kind] ?? location.kind, country].filter(Boolean).join(' · '),
  };
}

interface SearchFormProps {
  mode: BookingMode;
}

interface FlightLegInput {
  key: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  date: string;
}

/** A multi-city search starts with two legs and can grow up to five. */
const MIN_FLIGHT_LEGS = 2;
const MAX_FLIGHT_LEGS = 5;

function emptyLeg(): FlightLegInput {
  return { key: generateId(), origin: '', originName: '', destination: '', destinationName: '', date: '' };
}

function createLegs(count: number): FlightLegInput[] {
  return Array.from({ length: count }, () => emptyLeg());
}

export function SearchForm({ mode }: SearchFormProps) {
  const navigate = useNavigate();
  const { setSearchParams } = useApp();
  const { tp } = useI18n();

  const [origin, setOrigin] = useState('');
  const [originName, setOriginName] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [cabinClass, setCabinClass] = useState('economy');
  const [tripType, setTripType] = useState<'oneway' | 'return' | 'multicity'>('oneway');
  const [legs, setLegs] = useState<FlightLegInput[]>(() => createLegs(MIN_FLIGHT_LEGS));
  const [residency, setResidency] = useState<'resident' | 'non_resident'>('resident');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [travelersOpen, setTravelersOpen] = useState(false);
  const travelersRef = useRef<HTMLDivElement>(null);

  const isMultiCity = mode === 'flights' && tripType === 'multicity';
  const desktopLayout = getDesktopSearchLayout(mode, tripType);
  const supportsReturn = mode === 'flights' || mode === 'bus' || mode === 'train' || mode === 'ferry';
  const travelerCount = adults + children + infants;
  const travelerCountLabel = tp(travelerCount === 1 ? 'travelerSingular' : 'travelerPlural');

  useEffect(() => {
    if (!travelersOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (travelersRef.current && !travelersRef.current.contains(event.target as Node)) {
        setTravelersOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTravelersOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [travelersOpen]);

  const updateLeg = (index: number, patch: Partial<FlightLegInput>) => {
    setLegs((prev) => prev.map((leg, i) => (i === index ? { ...leg, ...patch } : leg)));
  };

  // A new leg continues from where the previous one landed, which is what a
  // real itinerary looks like; the traveller can still change it.
  const addLeg = () => {
    setLegs((prev) => {
      if (prev.length >= MAX_FLIGHT_LEGS) return prev;
      const last = prev[prev.length - 1];
      return [...prev, { ...emptyLeg(), origin: last.destination, originName: last.destinationName }];
    });
  };

  const removeLastLeg = () => {
    setLegs((prev) => (prev.length > MIN_FLIGHT_LEGS ? prev.slice(0, -1) : prev));
  };

  /**
   * Places come from the database, per mode.
   *
   * They used to be four hand-maintained lists in `data/locations.ts`, which meant opening a
   * new SGR station required editing that file and shipping it. Now HIMS adds the row and the
   * station appears in the card on the next load.
   */
  const [placeOptions, setPlaceOptions] = useState<{ id: string; name: string; subText: string }[]>([]);
  const [placesState, setPlacesState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const remotePlaces = mode === 'flights' || mode === 'stays';

  useEffect(() => {
    if (remotePlaces) {
      setPlaceOptions([]);
      setPlacesState('ready');
      return;
    }
    let cancelled = false;
    setPlacesState('loading');
    fetch(`/api/locations?mode=${encodeURIComponent(mode)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        return (await response.json()) as { data: { id: string; name: string; kind: string; region: string | null; countryCode: string; code: string }[] };
      })
      .then((body) => {
        if (cancelled) return;
        setPlaceOptions(body.data.map(optionFromLocation));
        setPlacesState('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setPlaceOptions([]);
          setPlacesState('failed');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, remotePlaces]);

  const loadRemotePlaces = useCallback(async (query: string) => {
    const search = new URLSearchParams({ mode, q: query });
    const response = await fetch(`/api/locations?${search.toString()}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const body = (await response.json()) as { data: { id: string; name: string; kind: string; region: string | null; countryCode: string; code: string }[] };
    return (body.data ?? []).map(optionFromLocation);
  }, [mode]);

  const loadOriginPlaces = useCallback(
    (query: string) => loadRemotePlaces(query).then((rows) => rows.filter((row) => row.id !== destination)),
    [destination, loadRemotePlaces],
  );
  const loadDestinationPlaces = useCallback(
    (query: string) => loadRemotePlaces(query).then((rows) => rows.filter((row) => row.id !== origin)),
    [loadRemotePlaces, origin],
  );

  const locationOptions = placeOptions;
  const originOptions = locationOptions.filter((location) => location.id !== destination);
  const destinationOptions = locationOptions.filter((location) => location.id !== origin);

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (isMultiCity) {
      legs.forEach((leg, index) => {
        if (!leg.origin) e[`leg_${index}_origin`] = tp('pleaseSelectDepartureAirport');
        if (!leg.destination) e[`leg_${index}_destination`] = tp('pleaseSelectDestinationAirport');
        if (leg.origin && leg.destination && leg.origin === leg.destination) {
          e[`leg_${index}_destination`] = tp('destinationDifferent');
        }
        if (!leg.date) e[`leg_${index}_date`] = tp('departureDateRequired');
      });
    } else if (mode === 'experiences') {
      if (!origin) e.origin = tp('destinationOrActivityRequired');
    } else if (mode === 'stays') {
      if (!origin) e.origin = tp('originRequired');
    } else {
      if (!origin) e.origin = tp('originRequired');
      if (!destination) e.destination = tp('destinationRequired');
      if (origin && destination && origin === destination) {
        e.destination = tp('destinationMustDifferOrigin');
      }
    }

    if (!isMultiCity && mode !== 'experiences' && !date) e.date = tp('pleaseSelectDate');

    if (mode === 'stays') {
      if (!checkOut) e.checkOut = tp('checkOutRequired');
      if (date && checkOut && new Date(checkOut) <= new Date(date)) {
        e.checkOut = tp('checkOutAfterCheckIn');
      }
    }

    if (supportsReturn && tripType === 'return' && !returnDate) {
      e.returnDate = tp('returnDateRequired');
    } else if (supportsReturn && tripType === 'return' && date && new Date(returnDate) <= new Date(date)) {
      e.returnDate = tp('returnDateAfterDeparture');
    }

    if (adults + children === 0) {
      e.adults = tp('atLeastOneTraveller');
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSearch = () => {
    if (!validate()) return;

    /**
     * The place *name* travels in `origin`/`destination`; the row id travels in extras.
     *
     * Every screen downstream either matches on the name or prints it, so an id in that field
     * shows a UUID in a heading and fails a name comparison. The id is still carried because
     * two places can share a name, and a search that has to disambiguate should do it by row.
     */
    const params: SearchParams = {
      mode,
      origin: originName || origin,
      destination: destinationName || destination,
      date,
      returnDate: supportsReturn && tripType === 'return' ? returnDate : undefined,
      adults,
      children,
      infants,
      extras: { originId: origin, destinationId: destination },
    };

    if (mode === 'stays') {
      params.extras = { ...params.extras, checkOut, rooms: String(rooms) };
    }
    if (mode === 'flights') {
      params.extras = { ...params.extras, tripType, cabinClass };
      if (isMultiCity) {
        params.legs = legs.map((leg) => ({
          origin: leg.origin,
          destination: leg.destination,
          date: leg.date,
        }));
        // Results are still searched on the first leg; multi-leg pricing is not modelled yet.
        params.origin = legs[0].originName || legs[0].origin;
        params.destination = legs[0].destinationName || legs[0].destination;
        params.date = legs[0].date;
      }
    }
    if (mode === 'ferry') {
      params.extras = { ...params.extras, residency, tripType };
    }
    if (mode === 'bus' || mode === 'train') {
      params.extras = { ...params.extras, tripType };
    }

    setSearchParams(params);

    const query = new URLSearchParams();
    if (origin) query.set('from', origin);
    if (destination) query.set('to', destination);
    if (originName) query.set('fromName', originName);
    if (destinationName) query.set('toName', destinationName);
    if (date) query.set('date', date);
    if (mode === 'stays' && checkOut) query.set('checkOut', checkOut);
    if (mode === 'stays') query.set('rooms', String(rooms));
    const suffix = query.toString();
    navigate(`/${mode}/results${suffix ? `?${suffix}` : ''}`);
  };

  const labelMap = {
    bus: { origin: tp('from'), destination: tp('to') },
    ferry: { origin: tp('departurePort'), destination: tp('arrivalPort') },
    flights: { origin: tp('originAirport'), destination: tp('destinationAirport') },
    train: { origin: tp('departureStation'), destination: tp('arrivalStation') },
    stays: { origin: tp('destination'), destination: '' },
    experiences: { origin: tp('destination'), destination: '' },
  };

  const labels = labelMap[mode];
  const minDate = addDays(todayISO(), 1);

  const formHeight = 'h-auto min-h-[26rem] sm:min-h-[17.5rem] lg:min-h-[12rem]';
  const singleRowDesktopGrid = desktopLayout?.formClass ?? '';

  return (
    <form
      className={`search-form flex flex-col overflow-visible ${formHeight} ${singleRowDesktopGrid}`}
      data-mode={mode}
      data-desktop-grid={desktopLayout?.breakpoint}
      onSubmit={(event) => {
        event.preventDefault();
        handleSearch();
      }}
    >
      <div className={`search-form-fields overflow-visible ${isMultiCity ? 'flex-none' : 'min-h-0 flex-1'} pr-0.5`}>
      {supportsReturn && (
        <div className="search-trip-type mb-4 inline-flex flex-wrap rounded-full bg-neutral-100 p-1">
          {([
            { value: 'oneway', label: tp('oneWay') },
            { value: 'return', label: tp('return') },
            ...(mode === 'flights' ? [{ value: 'multicity', label: tp('multiCity') } as const] : []),
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTripType(opt.value)}
              aria-pressed={tripType === opt.value}
              className={`rounded-full px-3.5 py-1.5 text-label font-semibold transition-colors ${
                tripType === opt.value
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-transparent text-neutral-600 hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isMultiCity ? (
        <div className="space-y-3">
          {legs.map((leg, index) => (
            <div key={leg.key} className="grid grid-cols-1 gap-x-3 gap-y-2.5 md:grid-cols-3">
              <Autocomplete
                id={`leg_${index}_origin`}
                label={tp('flightLegDeparture').replace('{number}', String(index + 1))}
                placeholder={tp('airportOrCity')}
                options={remotePlaces ? undefined : locationOptions.filter((location) => location.id !== leg.destination)}
                loadOptions={remotePlaces ? (query) => loadRemotePlaces(query).then((rows) => rows.filter((row) => row.id !== leg.destination)) : undefined}
                value={leg.originName}
                onChange={(id, name) => {
                  updateLeg(index, {
                    origin: id,
                    originName: name,
                    ...(id === leg.destination ? { destination: '', destinationName: '' } : {}),
                  });
                  setErrors((prev) => ({ ...prev, [`leg_${index}_origin`]: '' }));
                }}
                error={errors[`leg_${index}_origin`]}
                required
              />

              <Autocomplete
                id={`leg_${index}_destination`}
                label={tp('flightLegDestination').replace('{number}', String(index + 1))}
                placeholder={tp('airportOrCity')}
                options={remotePlaces ? undefined : locationOptions.filter((location) => location.id !== leg.origin)}
                loadOptions={remotePlaces ? (query) => loadRemotePlaces(query).then((rows) => rows.filter((row) => row.id !== leg.origin)) : undefined}
                value={leg.destinationName}
                onChange={(id, name) => {
                  updateLeg(index, {
                    destination: id,
                    destinationName: name,
                    ...(id === leg.origin ? { origin: '', originName: '' } : {}),
                  });
                  setErrors((prev) => ({ ...prev, [`leg_${index}_destination`]: '' }));
                }}
                error={errors[`leg_${index}_destination`]}
                required
              />

              <DatePicker
                id={`leg_${index}_date`}
                label={tp('flightLegDate').replace('{number}', String(index + 1))}
                value={leg.date}
                onChange={(d) => {
                  updateLeg(index, { date: d });
                  setErrors((prev) => ({ ...prev, [`leg_${index}_date`]: '' }));
                }}
                error={errors[`leg_${index}_date`]}
                required
                minDate={minDate}
                placeholder={tp('selectDate')}
              />
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <button
              type="button"
              onClick={addLeg}
              disabled={legs.length >= MAX_FLIGHT_LEGS}
              className="inline-flex items-center gap-1.5 text-label font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-neutral-400"
            >
              + {tp('addFlightLeg')}
            </button>
            {legs.length > MIN_FLIGHT_LEGS && (
              <button
                type="button"
                onClick={removeLastLeg}
                className="text-label font-medium text-neutral-500 transition-colors hover:text-error-600"
              >
                {tp('removeLastLeg')}
              </button>
            )}
          </div>
        </div>
      ) : (
      <div className={`search-fields-grid grid gap-x-4 gap-y-4 ${getGridClass(mode, tripType)}`}>
        <Autocomplete
          id="search_origin"
          label={labels.origin}
          placeholder={mode === 'bus' ? tp('chooseCity') : tp('searchLocation')}
          options={remotePlaces ? undefined : originOptions}
          loadOptions={remotePlaces ? loadOriginPlaces : undefined}
          value={originName}
          onChange={(id, name) => {
            setOrigin(id);
            setOriginName(name);
            if (id && id === destination) {
              setDestination('');
              setDestinationName('');
            }
            setErrors((prev) => ({ ...prev, origin: '' }));
          }}
          error={errors.origin}
          required
        />

        {mode !== 'stays' && mode !== 'experiences' && (
          <Autocomplete
            id="search_destination"
            label={labels.destination}
            placeholder={mode === 'bus' ? tp('chooseCity') : tp('searchLocation')}
            options={remotePlaces ? undefined : destinationOptions}
            loadOptions={remotePlaces ? loadDestinationPlaces : undefined}
            value={destinationName}
            onChange={(id, name) => {
              setDestination(id);
              setDestinationName(name);
              if (id && id === origin) {
                setOrigin('');
                setOriginName('');
              }
              setErrors((prev) => ({ ...prev, destination: '' }));
            }}
            error={errors.destination}
            required
          />
        )}

        <DatePicker
          id="search_date"
          label={mode === 'stays' ? tp('checkIn') : tp('departureDate')}
          value={date}
          onChange={(d) => {
            setDate(d);
            setErrors((prev) => ({ ...prev, date: '' }));
          }}
          error={errors.date}
          required={mode !== 'experiences'}
          minDate={minDate}
          placeholder={mode === 'stays' ? tp('selectCheckIn') : tp('selectDate')}
        />

        {mode === 'stays' && (
          <DatePicker
            id="search_checkout"
            label={tp('checkOut')}
            value={checkOut}
            onChange={(d) => {
              setCheckOut(d);
              setErrors((prev) => ({ ...prev, checkOut: '' }));
            }}
            error={errors.checkOut}
            required
            minDate={date ? addDays(date, 1) : minDate}
            placeholder={tp('selectCheckOut')}
          />
        )}

        {supportsReturn && tripType === 'return' && (
          <DatePicker
            id="search_return"
            label={tp('returnDate')}
            value={returnDate}
            onChange={(d) => {
              setReturnDate(d);
              setErrors((prev) => ({ ...prev, returnDate: '' }));
            }}
            error={errors.returnDate}
            required
            minDate={date ? addDays(date, 1) : minDate}
            placeholder={tp('selectReturnDate')}
          />
        )}

        {mode === 'ferry' && (
          <div className="col-span-2 min-w-0 lg:col-span-1">
            <label className="input-label">{tp('residency')}</label>
            <div className="flex h-[3.25rem] items-center gap-1 rounded-xl bg-neutral-50 p-1">
              <button
                type="button"
                onClick={() => setResidency('resident')}
                aria-pressed={residency === 'resident'}
                  className={`h-full min-w-0 flex-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold transition-colors ${
                  residency === 'resident'
                    ? 'bg-ink text-white'
                      : 'text-neutral-600 hover:bg-white/80'
                }`}
              >
                {tp('resident')}
              </button>
              <button
                type="button"
                onClick={() => setResidency('non_resident')}
                aria-pressed={residency === 'non_resident'}
                  className={`h-full min-w-0 flex-1 whitespace-nowrap rounded-lg px-2 text-xs font-semibold transition-colors ${
                  residency === 'non_resident'
                    ? 'bg-ink text-white'
                      : 'text-neutral-600 hover:bg-white/80'
                }`}
              >
                {tp('nonResident')}
              </button>
            </div>
          </div>
        )}

        {mode === 'flights' && (
          <div>
            <label className="input-label">{tp('cabinClass')}</label>
            <select
              className="input-field"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
            >
              <option value="economy">{tp('economy')}</option>
              <option value="premium_economy">{tp('premiumEconomy')}</option>
              <option value="business">{tp('business')}</option>
              <option value="first">{tp('firstClass')}</option>
            </select>
          </div>
        )}
      </div>
      )}
      </div>

      <div className="search-form-bottom mt-4 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div ref={travelersRef} className="search-travelers-field relative w-full min-w-0">
          <label className="input-label">{tp('travelersLabel')}</label>
          <button
            type="button"
            onClick={() => setTravelersOpen((open) => !open)}
            className="search-travelers-trigger flex min-h-[3.25rem] w-full min-w-0 items-center justify-between gap-3 rounded-xl bg-neutral-50 px-4 py-3 text-left transition-colors hover:bg-neutral-100"
            aria-label={`${tp('travelersLabel')}: ${travelerCount} ${travelerCountLabel}${mode === 'stays' ? `, ${rooms} ${tp(rooms === 1 ? 'roomSingular' : 'roomPlural')}` : ''}`}
            aria-haspopup="dialog"
            aria-expanded={travelersOpen}
            aria-controls="search-travelers-panel"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-neutral-900">
                {travelerCount} {travelerCountLabel}
                {mode === 'stays' && (
                  <> · {rooms} {tp(rooms === 1 ? 'roomSingular' : 'roomPlural')}</>
                )}
              </span>
            </span>
            <span aria-hidden="true" className={`shrink-0 text-meta text-neutral-400 transition-transform ${travelersOpen ? "rotate-180" : ""}`}>▾</span>
          </button>

          {travelersOpen && (
            <div
              id="search-travelers-panel"
              role="dialog"
              aria-label={tp('travelersLabel')}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-0 top-full z-[200] mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_-12px_rgba(0,85,221,0.2)]"
            >
              <div className="space-y-4">
                <PassengerCounter
                  id="adults"
                  label={tp('adults')}
                  value={adults}
                  onChange={(value) => {
                    setAdults(value);
                    setErrors((previous) => ({ ...previous, adults: '' }));
                  }}
                  min={1}
                  max={9}
                  description={tp(mode === 'train' ? 'trainAdultAge' : 'age12Plus')}
                />
                <PassengerCounter
                  id="children"
                  label={tp('children')}
                  value={children}
                  onChange={setChildren}
                  min={0}
                  max={9}
                  description={tp(mode === 'train' ? 'trainChildAge' : 'age2to11')}
                />
                {mode === 'bus' && (
                  <PassengerCounter
                    id="infants"
                    label={tp('infants')}
                    value={infants}
                    onChange={setInfants}
                    min={0}
                    max={4}
                    description={tp('under2')}
                  />
                )}
                {mode === 'stays' && (
                  <PassengerCounter
                    id="rooms"
                    label={tp('rooms')}
                    value={rooms}
                    onChange={setRooms}
                    min={1}
                    max={5}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setTravelersOpen(false)}
                className="btn-primary mt-4 w-full py-2"
              >
                {tp('done')}
              </button>
            </div>
          )}
        </div>

        {errors.adults && <p className="search-form-adult-error field-error lg:mb-2">{errors.adults}</p>}

        {/* The place list is fetched, so its failure is the traveller's problem to see. A card
            that silently offered no stations reads as a network with no stations. */}
        {placesState === 'failed' && (
          <p className="field-error" role="alert">
            {tp('placesLoadFailed')}
          </p>
        )}

        <div className="search-form-submit-wrapper flex justify-end">
          <button type="submit" className="btn-primary search-submit w-full px-6 py-2.5 sm:w-auto">
          
          {mode === 'stays' ? tp('searchStays') : mode === 'experiences' ? tp('searchExperiences') : tp('searchTrips')}
          </button>
        </div>
      </div>
    </form>
  );
}

function getGridClass(mode: BookingMode, tripType: 'oneway' | 'return' | 'multicity'): string {
  switch (mode) {
    case 'stays':
      // Three fields: keep them on one row so none is left orphaned beside an empty cell.
      return 'grid-cols-1 sm:grid-cols-3';
    case 'ferry':
      return tripType === 'return'
        ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5'
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4';
    case 'bus':
    case 'train':
      return tripType === 'return'
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-3';
    case 'flights':
      // A return flight adds a fifth field; widening the row keeps every tab one row tall
      // at desktop so the card height stays identical between tabs.
      return tripType === 'return'
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    case 'experiences':
      return 'grid-cols-1 sm:grid-cols-2';
    default:
      return 'grid-cols-2';
  }
}

function getDesktopSearchLayout(
  mode: BookingMode,
  tripType: 'oneway' | 'return' | 'multicity',
): {
  breakpoint: '1280' | '1440';
  formClass: string;
} | null {
  // Flights add a cabin field and a return date, so 7 controls on one row would clip the
  // placeholders at 1280px. They keep the two-row layout instead.
  if (mode === 'flights') return null;

  const breakpoint = mode === 'ferry' && tripType === 'return' ? '1440' : '1280';
  const fieldColumns = breakpoint === '1440'
    ? 'min-[1440px]:grid-cols-[repeat(6,minmax(0,1fr))_max-content]'
    : mode === 'experiences'
      ? 'min-[1280px]:grid-cols-[repeat(3,minmax(0,1fr))_max-content]'
      : (mode === 'bus' || mode === 'train') && tripType === 'return'
        ? 'min-[1280px]:grid-cols-[repeat(5,minmax(0,1fr))_max-content]'
        : mode === 'ferry'
          ? 'min-[1280px]:grid-cols-[repeat(5,minmax(0,1fr))_max-content]'
          : 'min-[1280px]:grid-cols-[repeat(4,minmax(0,1fr))_max-content]';

  if (breakpoint === '1440') {
    return {
      breakpoint,
      formClass: `min-[1440px]:grid min-[1440px]:items-end min-[1440px]:gap-x-4 min-[1440px]:gap-y-4 min-[1440px]:!h-auto min-[1440px]:!min-h-0 ${fieldColumns}`,
    };
  }

  return {
    breakpoint,
    formClass: `min-[1280px]:grid min-[1280px]:items-end min-[1280px]:gap-x-4 min-[1280px]:gap-y-4 min-[1280px]:!h-auto min-[1280px]:!min-h-0 ${fieldColumns}`,
  };
}
