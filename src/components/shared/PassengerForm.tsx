import { Select } from '@/components/ui/Select';
import { COUNTRIES } from '@/data/locations';
import { useI18n } from '@/context/I18nContext';
import type { PassengerInfo, PassengerCategory, Gender, IdType } from '@/types';
import { generateId } from '@/utils/format';

interface PassengerFormProps {
  passenger: PassengerInfo;
  index: number;
  onChange: (passenger: PassengerInfo) => void;
  showSeatLabel?: boolean;
  requireId?: boolean;
  errors?: PassengerFormErrors;
}

export interface PassengerFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  idType?: string;
  idNumber?: string;
  idCountry?: string;
}

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

export function PassengerForm({ passenger, index, onChange, showSeatLabel, requireId, errors }: PassengerFormProps) {
  const { tp } = useI18n();
  const idTypeOptions: { value: IdType; label: string }[] = [
    { value: 'driving_licence', label: tp('drivingLicence') },
    { value: 'national_id', label: tp('nationalId') },
    { value: 'passport', label: tp('passport') },
    { value: 'voter_card', label: tp('voterCard') },
  ];
  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: tp('male') },
    { value: 'female', label: tp('female') },
  ];
  const categoryOptions: { value: PassengerCategory; label: string }[] = [
    { value: 'adult', label: tp('adult') },
    { value: 'child', label: tp('child') },
  ];

  const update = (field: keyof PassengerInfo, value: string) => {
    onChange({ ...passenger, [field]: value });
  };

  // No overflow clipping on the panel — the select menus open downwards and must escape it.
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-neutral-200 bg-neutral-50/70 px-4 py-3 sm:px-5">
        <h4 className="text-body font-bold text-neutral-900">
          {tp('passengerLabel')} {index + 1}
        </h4>
        {showSeatLabel && passenger.seatId && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-meta font-semibold text-brand-600">
            {tp('seatLabel')} {passenger.seatId}
          </span>
        )}
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-4 gap-y-4">
          {/* Row 1: Full name (6) + Category (3) + Gender (3) */}
          <div className="sm:col-span-2 lg:col-span-6">
            <label htmlFor={`name_${passenger.id}`} className="input-label">{tp('fullNameAsOnId')}<span className="text-error-600 ml-0.5">*</span></label>
            <input id={`name_${passenger.id}`} type="text" className="input-field" value={passenger.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder={tp('enterFullName')} />
            {errors?.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div className="lg:col-span-3">
            <Select id={`category_${passenger.id}`} label={tp('categoryLabel')} value={passenger.category} onChange={(v) => update('category', v as PassengerCategory)} options={categoryOptions} required />
          </div>
          <div className="lg:col-span-3">
            <Select id={`gender_${passenger.id}`} label={tp('genderLabel')} value={passenger.gender} onChange={(v) => update('gender', v)} options={genderOptions} required />
          </div>

          {/* Row 2: Email (4) + Phone (4) + Country of Residence (4) */}
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor={`email_${passenger.id}`} className="input-label">{tp('emailLabel')}<span className="text-error-600 ml-0.5">*</span></label>
            <input id={`email_${passenger.id}`} type="email" className="input-field" value={passenger.email} onChange={(e) => update('email', e.target.value)} placeholder="example@email.com" />
            {errors?.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div className="lg:col-span-4">
            <label htmlFor={`phone_${passenger.id}`} className="input-label">{tp('checkoutPhoneNumber')}<span className="text-error-600 ml-0.5">*</span></label>
            <div className="flex">
              <select id={`phone_cc_${passenger.id}`} className="input-field w-[76px] shrink-0 rounded-r-none border-r-0 px-2 text-label" value={passenger.phoneCountryCode} onChange={(e) => update('phoneCountryCode', e.target.value)} aria-label={tp('countryCallingCode')}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.dialCode}>{c.dialCode}</option>)}
              </select>
              <input id={`phone_${passenger.id}`} type="tel" className="input-field min-w-0 rounded-l-none px-3" value={passenger.phone} onChange={(e) => update('phone', e.target.value)} placeholder="712 345 678" />
            </div>
            {errors?.phone && <p className="field-error">{errors.phone}</p>}
          </div>
          <div className="lg:col-span-4">
            <Select id={`country_${passenger.id}`} label={tp('countryOfResidence')} value={passenger.countryOfResidence} onChange={(v) => update('countryOfResidence', v)} options={COUNTRY_OPTIONS} required />
          </div>

          {/* Row 3: Identification section */}
          <div className="sm:col-span-2 lg:col-span-12 mt-1 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-meta font-bold uppercase tracking-wide text-neutral-600 mb-3">{tp('identificationLabel')} · {requireId ? tp('requiredLabel') : tp('optionalField')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select id={`idtype_${passenger.id}`} label={tp('idTypeLabel')} value={passenger.idType || ''} onChange={(v) => update('idType', v as IdType)} options={idTypeOptions} required={requireId} placeholder={tp('selectIdType')} error={errors?.idType} />
              <div>
                <label htmlFor={`idnum_${passenger.id}`} className="input-label">{tp('idNumberLabel')}{requireId && <span className="text-error-600 ml-0.5">*</span>}</label>
                <input id={`idnum_${passenger.id}`} type="text" className="input-field" value={passenger.idNumber || ''} onChange={(e) => update('idNumber', e.target.value)} placeholder={requireId ? tp('enterIdNumber') : tp('optionalLabel')} />
                {errors?.idNumber && <p className="field-error">{errors.idNumber}</p>}
              </div>
              <Select id={`idcountry_${passenger.id}`} label={tp('countryOfIssue')} value={passenger.idCountryOfIssue || ''} onChange={(v) => update('idCountryOfIssue', v)} options={COUNTRY_OPTIONS} required={requireId} placeholder={tp('selectCountry')} error={errors?.idCountry} />
            </div>
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
