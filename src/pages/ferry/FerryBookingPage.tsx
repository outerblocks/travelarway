import { useMemo, useState } from 'react';
import { useNavigate } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { useFerrySailing } from '@/hooks/useFerrySailing';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { TravelerPartyNote } from '@/components/shared/TravelerPartyNote';
import { partyMismatched } from '@/domain/passengers';
import { ErrorState, LoadingState } from '@/components/shared/States';
import { ferryFares, quoteFerrySailing } from '@/domain/pricing';
import { formatMoney } from '@/domain/money';
import { formatDate } from '@/utils/format';
import type { PassengerInfo } from '@/types';

/**
 * Ferry step 2: passenger details. The vessel class is chosen on the result card,
 * so this step no longer asks for it again, and the fare shown here is the quote
 * the review and checkout will charge (TZS for residents, USD for non-residents).
 */
export function FerryBookingPage() {
  const navigate = useNavigate();
  const { bookingState, setPassengers, setSelectedClassId, setSearchParams } = useApp();
  const { tp } = useI18n();

  const sailingId = bookingState.searchParams.extras?.sailingId;
  const selectedClassId = bookingState.searchParams.extras?.selectedClassId || bookingState.selectedClassId;
  const adults = bookingState.searchParams.adults;
  const children = bookingState.searchParams.children;
  const totalPassengers = adults + children;
  const residency = (bookingState.searchParams.extras?.residency || 'resident') as 'resident' | 'non_resident';

  const { sailing, status: sailingStatus } = useFerrySailing(sailingId);
  const selectedClass = sailing?.classes.find((cls) => cls.id === selectedClassId) ?? null;
  const residentFareMissing = Boolean(
    selectedClass && residency === 'resident' && selectedClass.hasResidentFare === false,
  );
  const quote = selectedClass
    ? quoteFerrySailing(selectedClass, residency, adults, children)
    : null;
  const fares = selectedClass ? ferryFares(selectedClass, residency) : null;

  const [passengers, setPassengersState] = useState<PassengerInfo[]>(() =>
    Array.from({ length: Math.max(1, totalPassengers) }, () => createPassenger()),
  );
  const sizedPassengers = useMemo(() => {
    const count = Math.max(1, totalPassengers);
    if (passengers.length === count) return passengers;
    return Array.from({ length: count }, (_, index) => passengers[index] ?? createPassenger());
  }, [passengers, totalPassengers]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePassengerChange = (index: number, updated: PassengerInfo) => {
    setPassengersState((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    sizedPassengers.forEach((p, i) => {
      if (!p.fullName) e[`name_${i}`] = tp('requiredLabel');
      if (!p.email) e[`email_${i}`] = tp('requiredLabel');
      if (!p.phone) e[`phone_${i}`] = tp('requiredLabel');
      if (!p.gender) e[`gender_${i}`] = tp('requiredLabel');
      if (!p.category) e[`category_${i}`] = tp('requiredLabel');
      if (!p.idType) e[`idtype_${i}`] = tp('requiredForFerry');
      if (!p.idNumber) e[`idnum_${i}`] = tp('requiredForFerry');
      if (!p.idCountryOfIssue) e[`idcountry_${i}`] = tp('requiredForFerry');
    });

    // Ferry prices by fare type, so a party that no longer matches the search would be a
    // quote the customer never agreed to.
    if (Object.keys(e).length === 0 && partyMismatched(sizedPassengers, adults, children)) {
      e.party = tp('partyMixMismatch')
        .replace('{adults}', String(adults))
        .replace('{children}', String(children));
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!selectedClass || !validate()) return;
    setPassengers(sizedPassengers);
    setSelectedClassId(selectedClass.id);
    if (sailing) {
      setSearchParams({
        ...bookingState.searchParams,
        extras: {
          ...bookingState.searchParams.extras,
          operatorName: sailing.operatorName,
          vesselName: sailing.vesselName,
          legOrigin: sailing.departurePort,
          legDestination: sailing.arrivalPort,
          legDeparture: sailing.departureTime,
          legArrival: sailing.arrivalTime,
          legDate: sailing.departureDate,
          classLabel: selectedClass.name,
        },
      });
    }
    navigate('/ferry/review');
  };

  if (sailingStatus === 'loading' && !sailing) return <LoadingState />;
  if (!sailing) {
    return (
      <ErrorState
        message={tp('unableLoadSailing')}
        subMessage={tp('pleaseGoBackTryAgain')}
        onRetry={() => navigate('/ferry/results')}
      />
    );
  }

  if (!selectedClass || !quote || !fares || residentFareMissing) {
    return (
      <ErrorState
        message={tp('classNotSelected')}
        subMessage={tp('pleaseGoBackTryAgain')}
        onRetry={() => navigate('/ferry/results')}
      />
    );
  }

  return (
    <>
      <div className="section-container py-8">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-page font-bold text-neutral-900">{tp('passengerInformation')}</h1>
          <p className="mt-1.5 text-body text-neutral-700">
            {sailing.vesselName} · {selectedClass.name} · {formatMoney(fares.adultFare, fares.currency)}
          </p>
          <p className="mt-1 text-body text-neutral-500">
            {sailing.departurePort} → {sailing.arrivalPort} · {formatDate(sailing.departureDate)} · {sailing.departureTime} · {sailing.arrivalTime}
          </p>
          <p className="mt-1.5 text-body text-neutral-500">{tp('ferryPassengerIdNote')}</p>
          <div className="mt-4">
            <TravelerPartyNote adults={adults} children={children} />
          </div>

          {errors.party && (
            <p role="alert" className="mt-6 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-meta text-error-700">
              {errors.party}
            </p>
          )}

          <section className="card mt-6 px-5 py-6 sm:px-8 sm:py-8">
            <div className="space-y-8">
              {sizedPassengers.map((p, i) => (
                <div key={p.id} className="passenger-block" data-error={errors[`name_${i}`] ? 'true' : undefined}>
                  <PassengerForm
                    passenger={p}
                    index={i}
                    onChange={(updated) => handlePassengerChange(i, updated)}
                    requireId
                    errors={{
                      name: errors[`name_${i}`],
                      email: errors[`email_${i}`],
                      phone: errors[`phone_${i}`],
                      gender: errors[`gender_${i}`],
                      category: errors[`category_${i}`],
                      idType: errors[`idtype_${i}`],
                      idNumber: errors[`idnum_${i}`],
                      idCountry: errors[`idcountry_${i}`],
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-meta text-neutral-500">
              {tp('pricesIn').replace('{currency}', quote.currency)} · {tp(residency === 'resident' ? 'resident' : 'nonResident')}
            </p>
            <button onClick={handleContinue} className="btn-primary px-8">
              {tp('reviewYourBooking')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
