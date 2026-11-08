import { Select } from '@/components/ui/Select';
import { COUNTRY_OPTIONS, DIAL_CODE_OPTIONS } from '@/data/countries';
import { useI18n } from '@/context/I18nContext';
import type { PassengerInfo, PassengerCategory, Gender, IdType } from '@/types';
import { generateId } from '@/utils/format';

interface PassengerFormProps {
  passenger: PassengerInfo;
  index: number;
  onChange: (passenger: PassengerInfo) => void;
  showSeatLabel?: boolean;
  requireId?: boolean;
  showGender?: boolean;
  showCountryOfResidence?: boolean;
  showIdentification?: boolean;
  categoryLabel?: string;
  categoryOptionLabels?: Partial<Record<PassengerCategory, string>>;
  includeInfant?: boolean;
  errors?: PassengerFormErrors;
}

export interface PassengerFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  category?: string;
  idType?: string;
  idNumber?: string;
  idCountry?: string;
}

export function PassengerForm({
  passenger,
  index,
  onChange,
  showSeatLabel,
  requireId,
  showGender = true,
  showCountryOfResidence = true,
  showIdentification = true,
  categoryLabel,
  categoryOptionLabels,
  includeInfant = false,
  errors,
}: PassengerFormProps) {
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
    { value: 'adult', label: categoryOptionLabels?.adult ?? tp('adult') },
    { value: 'child', label: categoryOptionLabels?.child ?? tp('child') },
    ...(includeInfant ? [{ value: 'infant' as const, label: categoryOptionLabels?.infant ?? tp('infant') }] : []),
  ];

  const update = (field: keyof PassengerInfo, value: string) => {
    onChange({ ...passenger, [field]: value });
  };

  // Container queries so a form beside a seat map does not use the same columns as a
  // full-width booking step. Two columns when the card is wide enough; never four.
  return (
    <div className="@container">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <h4 className="text-body font-bold text-neutral-900">
          {tp('passengerLabel')} {index + 1}
        </h4>
        {showSeatLabel && passenger.seatId && (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-meta font-semibold text-brand-600">
            {tp('seatLabel')} {passenger.seatId}
          </span>
        )}
      </div>

      <div className="pt-5">
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 @lg:grid-cols-2">
          <div className="@lg:col-span-2">
            <label htmlFor={`name_${passenger.id}`} className="input-label">{tp('fullNameAsOnId')}<span className="text-error-600 ml-0.5">*</span></label>
            <input id={`name_${passenger.id}`} type="text" className="input-field" value={passenger.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder={tp('enterFullName')} required aria-invalid={Boolean(errors?.name)} autoComplete="name" />
            {errors?.name && <p className="field-error">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor={`email_${passenger.id}`} className="input-label">{tp('emailLabel')}<span className="text-error-600 ml-0.5">*</span></label>
            <input id={`email_${passenger.id}`} type="email" className="input-field" value={passenger.email} onChange={(e) => update('email', e.target.value)} placeholder="example@email.com" required aria-invalid={Boolean(errors?.email)} autoComplete="email" />
            {errors?.email && <p className="field-error">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor={`phone_${passenger.id}`} className="input-label">{tp('checkoutPhoneNumber')}<span className="text-error-600 ml-0.5">*</span></label>
            <div className="flex">
              <div className="relative w-[7.25rem] shrink-0">
                <select
                  id={`phone_cc_${passenger.id}`}
                  className="input-field native-select rounded-r-none border-r-0 py-3 pl-3 pr-8"
                  value={passenger.phoneCountryCode}
                  onChange={(e) => update('phoneCountryCode', e.target.value)}
                  aria-label={tp('countryCallingCode')}
                >
                  {DIAL_CODE_OPTIONS.map((dial) => (
                    <option key={dial.value} value={dial.value}>{dial.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-body text-neutral-400" aria-hidden="true">▾</span>
              </div>
              <input
                id={`phone_${passenger.id}`}
                type="tel"
                className="input-field min-w-0 rounded-l-none px-3"
                value={passenger.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="712 345 678"
                required
                aria-invalid={Boolean(errors?.phone)}
                autoComplete="tel-national"
              />
            </div>
            {errors?.phone && <p className="field-error">{errors.phone}</p>}
          </div>

          {showGender && (
            <div>
              <Select id={`gender_${passenger.id}`} label={tp('genderLabel')} value={passenger.gender ?? ''} onChange={(v) => update('gender', v)} options={genderOptions} required placeholder={tp('selectGender')} error={errors?.gender} />
            </div>
          )}
          <div>
            <Select id={`category_${passenger.id}`} label={categoryLabel ?? tp('categoryLabel')} value={passenger.category ?? ''} onChange={(v) => update('category', v as PassengerCategory)} options={categoryOptions} required placeholder={tp('selectCategory')} error={errors?.category} />
          </div>
          {showCountryOfResidence && (
            <div className={showGender ? '@lg:col-span-2' : ''}>
              <Select id={`country_${passenger.id}`} label={tp('countryOfResidence')} value={passenger.countryOfResidence} onChange={(v) => update('countryOfResidence', v)} options={COUNTRY_OPTIONS} required />
            </div>
          )}

          {showIdentification && (
            <fieldset className="@lg:col-span-2 mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-5">
              <legend className="px-1 text-label font-medium text-neutral-700">
                {tp('identificationLabel')}
                <span className={requireId ? 'font-normal text-error-600' : 'font-normal text-neutral-500'}>
                  {' · '}{requireId ? tp('requiredLabel') : tp('optionalField')}
                </span>
              </legend>
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 @md:grid-cols-2">
                <div>
                  <Select id={`idtype_${passenger.id}`} label={tp('idTypeLabel')} value={passenger.idType || ''} onChange={(v) => update('idType', v as IdType)} options={idTypeOptions} required={requireId} placeholder={tp('selectIdType')} error={errors?.idType} />
                </div>
                <div>
                  <label htmlFor={`idnum_${passenger.id}`} className="input-label">{tp('idNumberLabel')}{requireId && <span className="text-error-600 ml-0.5">*</span>}</label>
                  <input id={`idnum_${passenger.id}`} type="text" className="input-field" value={passenger.idNumber || ''} onChange={(e) => update('idNumber', e.target.value)} placeholder={requireId ? tp('enterIdNumber') : tp('optionalLabel')} />
                  {errors?.idNumber && <p className="field-error">{errors.idNumber}</p>}
                </div>
                <div className="@md:col-span-2">
                  <Select id={`idcountry_${passenger.id}`} label={tp('countryOfIssue')} value={passenger.idCountryOfIssue || ''} onChange={(v) => update('idCountryOfIssue', v)} options={COUNTRY_OPTIONS} required={requireId} placeholder={tp('selectCountry')} error={errors?.idCountry} />
                </div>
              </div>
            </fieldset>
          )}
        </div>
      </div>
    </div>
  );
}

export function createPassenger(): PassengerInfo {
  return {
    id: generateId(),
    // No seat, no gender and no fare category are assumed: each is something the traveller
    // states. Guessing `male`/`adult` pre-selected an answer for them and, worse, priced a
    // passenger as an adult that nobody had said was an adult.
    fullName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+255',
    countryOfResidence: 'TZ',
    idType: undefined,
    idNumber: undefined,
    idCountryOfIssue: undefined,
  };
}
