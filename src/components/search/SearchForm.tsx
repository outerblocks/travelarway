import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Autocomplete } from '@/components/ui/Autocomplete';
import { DatePicker } from '@/components/ui/DatePicker';
import { PassengerCounter } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { TANZANIA_LOCATIONS, TANZANIA_PORTS, TANZANIA_AIRPORTS, TANZANIA_STATIONS } from '@/data/locations';
import { todayISO, addDays } from '@/utils/format';
import type { BookingMode, SearchParams } from '@/types';

interface SearchFormProps {
  mode: BookingMode;
}

export function SearchForm({ mode }: SearchFormProps) {
  const navigate = useNavigate();
  const { setSearchParams } = useApp();

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
  const [residency, setResidency] = useState<'resident' | 'non_resident'>('resident');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getLocations = () => {
    switch (mode) {
      case 'bus': return TANZANIA_LOCATIONS;
      case 'ferry': return TANZANIA_PORTS;
      case 'flights': return TANZANIA_AIRPORTS;
      case 'train': return TANZANIA_STATIONS;
      case 'stays': return TANZANIA_LOCATIONS;
      case 'experiences': return TANZANIA_LOCATIONS;
      default: return TANZANIA_LOCATIONS;
    }
  };

  const locations = getLocations();
  const locationOptions = locations.map((l) => ({
    id: l.id,
    name: l.name,
    subText: l.type === 'city' ? `${l.region}, ${l.country}` : `${l.type}, ${l.region}`,
  }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (mode !== 'experiences') {
      if (!origin) e.origin = 'Please select a departure location';
      if (!destination) e.destination = 'Please select a destination';
      if (origin && destination && origin === destination) {
        e.destination = 'Destination must be different from origin';
      }
    } else {
      if (!origin) e.origin = 'Please select a destination or activity';
    }

    if (mode !== 'experiences' && !date) e.date = 'Please select a date';

    if (mode === 'stays') {
      if (!checkOut) e.checkOut = 'Please select a check-out date';
      if (date && checkOut && new Date(checkOut) <= new Date(date)) {
        e.checkOut = 'Check-out must be after check-in';
      }
    }

    if (mode === 'flights' && tripType === 'return' && !returnDate) {
      e.returnDate = 'Please select a return date';
    }

    if (adults + children === 0) {
      e.adults = 'At least one adult or child is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSearch = () => {
    if (!validate()) return;

    const params: SearchParams = {
      mode,
      origin,
      destination,
      date,
      returnDate: tripType === 'return' ? returnDate : undefined,
      adults,
      children,
      infants,
      extras: {},
    };

    if (mode === 'stays') {
      params.extras = { checkOut, rooms: String(rooms) };
    }
    if (mode === 'flights') {
      params.extras = { tripType, cabinClass };
    }
    if (mode === 'ferry') {
      params.extras = { residency };
    }

    setSearchParams(params);
    navigate(`/${mode}/results`);
  };

  const labelMap = {
    bus: { origin: 'From', destination: 'To' },
    ferry: { origin: 'Departure Port', destination: 'Arrival Port' },
    flights: { origin: 'Origin Airport', destination: 'Destination Airport' },
    train: { origin: 'Departure Station', destination: 'Arrival Station' },
    stays: { origin: 'Destination, location, or property', destination: '' },
    experiences: { origin: 'Destination or activity', destination: '' },
  };

  const labels = labelMap[mode];
  const minDate = addDays(todayISO(), 1);

  return (
    <div>
      {mode === 'flights' && (
        <div className="flex flex-wrap gap-2 mb-3">
          {([
            { value: 'oneway', label: 'One-way' },
            { value: 'return', label: 'Return' },
            { value: 'multicity', label: 'Multi-city' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTripType(opt.value)}
              className={`px-3 py-1.5 text-label font-medium rounded-sm transition-colors ${
                tripType === opt.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className={`grid gap-3 ${getGridClass(mode)}`}>
        <Autocomplete
          id="search_origin"
          label={labels.origin}
          placeholder="Search location..."
          options={locationOptions}
          value={originName}
          onChange={(id, name) => {
            setOrigin(id);
            setOriginName(name);
            setErrors((prev) => ({ ...prev, origin: '' }));
          }}
          error={errors.origin}
          required
        />

        {mode !== 'stays' && mode !== 'experiences' && (
          <Autocomplete
            id="search_destination"
            label={labels.destination}
            placeholder="Search location..."
            options={locationOptions}
            value={destinationName}
            onChange={(id, name) => {
              setDestination(id);
              setDestinationName(name);
              setErrors((prev) => ({ ...prev, destination: '' }));
            }}
            error={errors.destination}
            required
          />
        )}

        <DatePicker
          id="search_date"
          label={mode === 'stays' ? 'Check-in' : 'Departure Date'}
          value={date}
          onChange={(d) => {
            setDate(d);
            setErrors((prev) => ({ ...prev, date: '' }));
          }}
          error={errors.date}
          required={mode !== 'experiences'}
          minDate={minDate}
          placeholder={mode === 'stays' ? 'Select check-in' : 'Select date'}
        />

        {mode === 'stays' && (
          <DatePicker
            id="search_checkout"
            label="Check-out"
            value={checkOut}
            onChange={(d) => {
              setCheckOut(d);
              setErrors((prev) => ({ ...prev, checkOut: '' }));
            }}
            error={errors.checkOut}
            required
            minDate={date ? addDays(date, 1) : minDate}
            placeholder="Select check-out"
          />
        )}

        {mode === 'flights' && tripType === 'return' && (
          <DatePicker
            id="search_return"
            label="Return Date"
            value={returnDate}
            onChange={(d) => {
              setReturnDate(d);
              setErrors((prev) => ({ ...prev, returnDate: '' }));
            }}
            error={errors.returnDate}
            required
            minDate={date ? addDays(date, 1) : minDate}
            placeholder="Select return date"
          />
        )}

        {mode === 'ferry' && (
          <div>
            <label className="input-label">Residency</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResidency('resident')}
                className={`flex-1 px-4 py-3 text-body font-medium rounded-sm transition-colors ${
                  residency === 'resident'
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Resident
              </button>
              <button
                type="button"
                onClick={() => setResidency('non_resident')}
                className={`flex-1 px-4 py-3 text-body font-medium rounded-sm transition-colors ${
                  residency === 'non_resident'
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                Non-Resident
              </button>
            </div>
          </div>
        )}

        {mode === 'flights' && (
          <div>
            <label className="input-label">Cabin Class</label>
            <select
              className="input-field"
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value)}
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
        <PassengerCounter
          id="adults"
          label={mode === 'stays' ? 'Adults' : 'Adults'}
          value={adults}
          onChange={(v) => { setAdults(v); setErrors((prev) => ({ ...prev, adults: '' })); }}
          min={1}
          max={9}
          description="Age 12+"
        />
        <PassengerCounter
          id="children"
          label="Children"
          value={children}
          onChange={setChildren}
          min={0}
          max={9}
          description="Age 2-11"
        />
        {mode === 'bus' && (
          <PassengerCounter
            id="infants"
            label="Infants"
            value={infants}
            onChange={setInfants}
            min={0}
            max={4}
            description="Under 2"
          />
        )}
        {mode === 'stays' && (
          <PassengerCounter
            id="rooms"
            label="Rooms"
            value={rooms}
            onChange={setRooms}
            min={1}
            max={5}
          />
        )}
      </div>

      {errors.adults && <p className="field-error mt-2">{errors.adults}</p>}

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={handleSearch} className="btn-primary px-7 py-3">
          <Search size={20} />
          Search {mode === 'stays' ? 'Stays' : mode === 'experiences' ? 'Experiences' : 'Trips'}
        </button>
      </div>
    </div>
  );
}

function getGridClass(mode: BookingMode): string {
  switch (mode) {
    case 'bus':
    case 'train':
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    case 'ferry':
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    case 'flights':
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    case 'stays':
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
    case 'experiences':
      return 'grid-cols-1 sm:grid-cols-2';
    default:
      return 'grid-cols-1 sm:grid-cols-2';
  }
}
