import { Select, PassengerCounter } from '@/components/ui/Select';
import { COUNTRIES } from '@/data/locations';
import type { PassengerInfo, PassengerCategory, Gender, IdType } from '@/types';
import { generateId } from '@/utils/format';

interface PassengerFormProps {
  passenger: PassengerInfo;
  index: number;
  onChange: (passenger: PassengerInfo) => void;
  showSeatLabel?: boolean;
  requireId?: boolean;
}

const ID_TYPE_OPTIONS: { value: IdType; label: string }[] = [
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_card', label: 'Voter Card' },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const CATEGORY_OPTIONS: { value: PassengerCategory; label: string }[] = [
  { value: 'adult', label: 'Adult' },
  { value: 'child', label: 'Child' },
];

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const DIAL_CODE_OPTIONS = COUNTRIES.map((c) => ({ value: c.dialCode, label: `${c.name} (${c.dialCode})` }));

export function PassengerForm({ passenger, index, onChange, showSeatLabel, requireId }: PassengerFormProps) {
  const update = (field: keyof PassengerInfo, value: string) => {
    onChange({ ...passenger, [field]: value });
  };

  return (
    <div className="border-b border-neutral-200 pb-6 last:border-b-0">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-listing font-bold text-neutral-900">
          Passenger {index + 1}
          {showSeatLabel && passenger.seatId && (
            <span className="ml-2 text-body font-medium text-brand-600">Seat {passenger.seatId}</span>
          )}
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-3 gap-y-3">
        <div className="md:col-span-6">
          <label htmlFor={`name_${passenger.id}`} className="input-label">Full name as on ID<span className="text-error-600 ml-0.5">*</span></label>
          <input id={`name_${passenger.id}`} type="text" className="input-field" value={passenger.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Enter full name" />
        </div>
        <div className="md:col-span-3">
          <label htmlFor={`email_${passenger.id}`} className="input-label">Email<span className="text-error-600 ml-0.5">*</span></label>
          <input id={`email_${passenger.id}`} type="email" className="input-field" value={passenger.email} onChange={(e) => update('email', e.target.value)} placeholder="example@email.com" />
        </div>
        <div className="md:col-span-3">
          <label htmlFor={`phone_${passenger.id}`} className="input-label">Phone number<span className="text-error-600 ml-0.5">*</span></label>
          <div className="flex">
            <select id={`phone_cc_${passenger.id}`} className="input-field w-[76px] shrink-0 rounded-r-none px-2" value={passenger.phoneCountryCode} onChange={(e) => update('phoneCountryCode', e.target.value)} aria-label="Country calling code">
              {COUNTRIES.map((c) => <option key={c.code} value={c.dialCode}>{c.dialCode}</option>)}
            </select>
            <input id={`phone_${passenger.id}`} type="tel" className="input-field min-w-0 rounded-l-none border-l-0 px-3" value={passenger.phone} onChange={(e) => update('phone', e.target.value)} placeholder="712 345 678" />
          </div>
        </div>

        <div className="md:col-span-3">
          <Select id={`gender_${passenger.id}`} label="Gender" value={passenger.gender} onChange={(v) => update('gender', v)} options={GENDER_OPTIONS} required />
        </div>
        <div className="md:col-span-3">
          <Select id={`category_${passenger.id}`} label="Category" value={passenger.category} onChange={(v) => update('category', v as PassengerCategory)} options={CATEGORY_OPTIONS} required />
        </div>
        <div className="md:col-span-6">
          <Select id={`country_${passenger.id}`} label="Country of residence" value={passenger.countryOfResidence} onChange={(v) => update('countryOfResidence', v)} options={COUNTRY_OPTIONS} required />
        </div>

        <div className="md:col-span-12 mt-1 rounded-sm bg-neutral-50 border border-neutral-200 p-3">
          <p className="text-meta font-bold uppercase tracking-wide text-neutral-600 mb-3">Identification · {requireId ? 'Required' : 'Optional field'}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select id={`idtype_${passenger.id}`} label="ID type" value={passenger.idType || ''} onChange={(v) => update('idType', v as IdType)} options={ID_TYPE_OPTIONS} required={requireId} placeholder="Select ID type" />
            <div>
              <label htmlFor={`idnum_${passenger.id}`} className="input-label">ID number{requireId && <span className="text-error-600 ml-0.5">*</span>}</label>
              <input id={`idnum_${passenger.id}`} type="text" className="input-field" value={passenger.idNumber || ''} onChange={(e) => update('idNumber', e.target.value)} placeholder={requireId ? 'Enter ID number' : 'Optional'} />
            </div>
            <Select id={`idcountry_${passenger.id}`} label="Country of issue" value={passenger.idCountryOfIssue || ''} onChange={(v) => update('idCountryOfIssue', v)} options={COUNTRY_OPTIONS} required={requireId} placeholder="Select country" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function createPassenger(category: PassengerCategory, seatId?: string): PassengerInfo {
  return {
    id: generateId(),
    category,
    seatId,
    fullName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+255',
    gender: 'male',
    countryOfResidence: 'TZ',
    idType: undefined,
    idNumber: undefined,
    idCountryOfIssue: undefined,
  };
}
