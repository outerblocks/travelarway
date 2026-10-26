import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { getFerrySailing } from '@/data/operations';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { LoadingState, ErrorState, SearchSummaryBar } from '@/components/shared/States';
import { formatDate } from '@/utils/format';
import type { FerrySailing, PassengerInfo } from '@/types';

export function FerryBookingPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers, setSelectedClassId, setSearchParams } = useApp();
  const { tp } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sailing, setSailing] = useState<FerrySailing | null>(null);
  const [selectedClassId, setSelectedClassIdState] = useState('');
  const [passengers, setPassengersState] = useState<PassengerInfo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sailingId = bookingState.searchParams.extras?.sailingId;
  const totalPassengers = bookingState.searchParams.adults + bookingState.searchParams.children;
  const residency = (bookingState.searchParams.extras?.residency || 'resident') as 'resident' | 'non_resident';

  useEffect(() => {
    const timer = setTimeout(() => {
      const found = getFerrySailing(sailingId);
      if (found) {
        setSailing(found);
        setLoading(false);
      } else {
        setError(true);
        setLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sailingId]);

  const handleClassSelect = (classId: string) => {
    setSelectedClassIdState(classId);
    const adults = bookingState.searchParams.adults;
    const newPassengers: PassengerInfo[] = [];
    for (let i = 0; i < totalPassengers; i++) {
      newPassengers.push(createPassenger(i < adults ? 'adult' : 'child'));
    }
    setPassengersState(newPassengers);
    setErrors((p) => ({ ...p, class: '' }));
  };

  const handlePassengerChange = (index: number, updated: PassengerInfo) => {
    setPassengersState((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedClassId) e.class = tp('selectVesselClassError');

    passengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = tp('requiredLabel');
      if (!p.email) e[`email_${i}`] = tp('requiredLabel');
      if (!p.phone) e[`phone_${i}`] = tp('requiredLabel');
      if (!p.idType) e[`idtype_${i}`] = tp('requiredForFerry');
      if (!p.idNumber) e[`idnum_${i}`] = tp('requiredForFerry');
      if (!p.idCountryOfIssue) e[`idcountry_${i}`] = tp('requiredForFerry');
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    setPassengers(passengers);
    setSelectedClassId(selectedClassId);
    setSearchParams({
      ...bookingState.searchParams,
      extras: { ...bookingState.searchParams.extras, selectedClassId },
    });
    navigate('/ferry/review');
  };

  if (loading) return (
    <>
      <SearchSummaryBar>
        <Link to="/ferry/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">{tp('selectClassAndDetails')}</span>
      </SearchSummaryBar>
      <LoadingState message={tp('loadingSailingDetails')} />
    </>
  );

  if (error || !sailing) return (
    <ErrorState
      message={tp('unableLoadSailing')}
      subMessage={tp('pleaseGoBackTryAgain')}
      onRetry={() => navigate('/ferry/results')}
    />
  );

  const selectedClass = sailing.classes.find((c) => c.id === selectedClassId);

  return (
    <>
      <SearchSummaryBar>
        <Link to="/ferry/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">
          {sailing.operatorName} · {sailing.vesselName}
        </span>
        <span className="text-body text-neutral-500">{sailing.departurePort} → {sailing.arrivalPort}</span>
      </SearchSummaryBar>

      <div className="section-container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Class Selection */}
            <div className="card p-6">
              <h2 className="text-listing font-bold text-neutral-900 mb-1">{tp('selectVesselClass')}</h2>
              <p className="text-meta text-neutral-500 mb-4">
                {tp('noSeatSelectionFerry')}
              </p>
              {errors.class && <p className="field-error mb-3" data-error="true">{errors.class}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sailing.classes.map((cls) => {
                  const isSelected = selectedClassId === cls.id;
                  const fare = residency === 'resident' ? cls.residentAdultFare : cls.adultFare;
                  const fareLabel = cls.currency === 'TZS' ? `TSh ${fare.toLocaleString()}` : `$${fare}`;

                  return (
                    <button
                      key={cls.id}
                      onClick={() => handleClassSelect(cls.id)}
                      className={`text-left p-4 border rounded-sm transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                          : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-body font-bold text-neutral-900">{cls.name}</span>
                        {isSelected && <Check />}
                      </div>
                      <p className="text-meta text-neutral-500 mb-3">{cls.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-body font-bold text-brand-600">{fareLabel}</p>
                          <p className="text-meta text-neutral-500">{tp('perAdultResidency').replace('{residency}', tp(residency === 'resident' ? 'resident' : 'nonResident'))}</p>
                        </div>
                        <span className="text-meta text-neutral-500 flex items-center gap-1">
                          <Users size={12} /> {tp('availableCount').replace('{count}', String(cls.availableCapacity))}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passenger Information */}
            {selectedClass && passengers.length > 0 && (
              <div className="card p-6 animate-fade-in">
                <h2 className="text-listing font-bold text-neutral-900 mb-1">{tp('passengerInformation')}</h2>
                <p className="text-meta text-neutral-500 mb-6">
                  {tp('ferryPassengerIdNote')}
                </p>

                <div className="space-y-4">
                  {passengers.map((p, i) => (
                    <div key={p.id} data-error={errors[`name_${i}`] ? 'true' : undefined}>
                      <PassengerForm
                        passenger={p}
                        index={i}
                        onChange={(updated) => handlePassengerChange(i, updated)}
                        requireId
                        errors={{
                          name: errors[`name_${i}`],
                          email: errors[`email_${i}`],
                          phone: errors[`phone_${i}`],
                          idType: errors[`idtype_${i}`],
                          idNumber: errors[`idnum_${i}`],
                          idCountry: errors[`idcountry_${i}`],
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-200 flex justify-end">
                  <button onClick={handleContinue} className="btn-primary">
                    {tp('continueToReview')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <div className="card p-6 sticky top-20">
              <h3 className="text-listing font-bold text-neutral-900 mb-4">{tp('summary')}</h3>
              <div className="space-y-2 text-body">
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('vessel')}</span>
                  <span className="font-medium text-neutral-900">{sailing.vesselName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('ticketRoute')}</span>
                  <span className="font-medium text-neutral-900 text-right text-meta">
                    {sailing.departurePort} → {sailing.arrivalPort}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('ticketDate')}</span>
                  <span className="font-medium text-neutral-900">{formatDate(sailing.departureDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('departure')}</span>
                  <span className="font-medium text-neutral-900">{sailing.departureTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('ticketClass')}</span>
                  <span className="font-medium text-neutral-900">{selectedClass?.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('residency')}</span>
                  <span className="font-medium text-neutral-900">{tp(residency === 'resident' ? 'resident' : 'nonResident')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{tp('checkoutPassengers')}</span>
                  <span className="font-medium text-neutral-900">{totalPassengers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Check() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-brand-600">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
