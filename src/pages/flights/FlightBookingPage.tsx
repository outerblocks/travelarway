import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { useNavigate } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { FlightCheckoutSteps } from '@/components/flights/FlightCheckoutSteps';
import { FlightFareFacts } from '@/components/flights/FlightFareFacts';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { TravelerPartyNote } from '@/components/shared/TravelerPartyNote';
import { ErrorState, LoadingState, QueryFeedback } from '@/components/shared/States';
import { flightIdentityPolicy } from '@/domain/flight-identity';
import { partyMismatched } from '@/domain/passengers';
import { AirlineLogo } from '@/components/flights/AirlineLogo';
import { cabinLine, displayAirline, flightNumbers, iataFromPlace, isInternationalAirOffer, marketingLabel, splitRoundTrip } from '@/domain/flight-results';
import { formatDate } from '@/utils/format';
import type { PassengerInfo } from '@/types';
import { offerIdFromSearch } from '@/pages/stays/stay-offer-id';
import { useFlightOffer } from '@/pages/flights/useFlightOffer';

export function FlightBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingState, setPassengers, setSearchParams } = useApp();
  const { tp } = useI18n();
  const params = bookingState.searchParams;
  const offerId = offerIdFromSearch(location.search) || params.extras?.flightOfferId || '';
  const { status, offer } = useFlightOffer(offerId);
  const journey = offer
    ? splitRoundTrip(offer.itinerary, iataFromPlace(params.destination))
    : { outbound: [], inbound: [] };
  const adults = params.adults;
  const children = params.children;
  const infants = params.infants;
  const totalPassengers = Math.max(1, adults + children + infants);

  const [passengers, setPassengerRows] = useState<PassengerInfo[]>(() =>
    Array.from({ length: totalPassengers }, () => createPassenger()),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sized = useMemo(() => {
    if (passengers.length === totalPassengers) return passengers;
    return Array.from({ length: totalPassengers }, (_, index) => passengers[index] ?? createPassenger());
  }, [passengers, totalPassengers]);
  const international = offer ? isInternationalAirOffer(offer) : false;
  const identity = flightIdentityPolicy(international);

  useEffect(() => {
    if (!international) return;
    setPassengerRows((previous) => {
      const rows = previous.length === totalPassengers
        ? previous
        : Array.from({ length: totalPassengers }, (_, index) => previous[index] ?? createPassenger());
      if (rows.every((row) => row.idType === 'passport')) return previous.length === totalPassengers ? previous : rows;
      return rows.map((row) => (row.idType === 'passport' ? row : { ...row, idType: 'passport' as const }));
    });
  }, [international, totalPassengers]);

  const handleChange = (index: number, updated: PassengerInfo) => {
    setPassengerRows((previous) => {
      const next = [...(previous.length === totalPassengers ? previous : sized)];
      next[index] = updated;
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    sized.forEach((passenger, index) => {
      if (!passenger.fullName.trim()) next[`name_${index}`] = tp('requiredLabel');
      if (!passenger.email.trim()) next[`email_${index}`] = tp('requiredLabel');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) next[`email_${index}`] = tp('validEmailRequired');
      if (!passenger.phone.trim()) next[`phone_${index}`] = tp('requiredLabel');
      if (!passenger.gender) next[`gender_${index}`] = tp('requiredLabel');
      if (!passenger.category) next[`category_${index}`] = tp('requiredLabel');
      if (identity.requireId) {
        if (international) {
          if (passenger.idType !== 'passport') next[`idtype_${index}`] = tp('internationalPassportNote');
        } else if (!passenger.idType || !identity.allowedIdTypes.includes(passenger.idType)) {
          next[`idtype_${index}`] = tp('requiredLabel');
        }
        if (!passenger.idNumber?.trim()) next[`idnum_${index}`] = tp('requiredLabel');
        if (!passenger.idCountryOfIssue) next[`idcountry_${index}`] = tp('requiredLabel');
      }
    });
    if (Object.keys(next).length === 0 && partyMismatched(sized, adults, children)) {
      next.party = tp('partyMixMismatch')
        .replace('{adults}', String(adults))
        .replace('{children}', String(children));
    }
    const infantCount = sized.filter((passenger) => passenger.category === 'infant').length;
    if (Object.keys(next).length === 0 && infantCount !== infants) {
      next.party = tp('infantMixMismatch').replace('{count}', String(infants));
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = () => {
    if (!offer || !validate()) return;
    setPassengers(sized);
    setSearchParams({
      ...params,
      extras: {
        ...params.extras,
        flightOfferId: offer.id,
      },
    });
    navigate(`/flights/review?offer=${encodeURIComponent(offer.id)}`);
  };

  return (
    <QueryFeedback
      status={status}
      errorMessage={tp('unableLoadFlights')}
      loading={<LoadingState count={2} message={tp('loadingFlightDetails')} />}
    >
      {!offer ? (
        <ErrorState message={tp('flightNotFound')} onRetry={() => navigate('/flights/results')} />
      ) : (
        <>
          <div className="section-container py-6">
            <h1 className="text-page font-bold text-neutral-900">{tp('flightBookingTitle')}</h1>
            <p className="mt-1 text-body text-neutral-700">{marketingLabel(offer)}</p>
            <p className="mt-2 max-w-2xl text-body text-neutral-600">{tp('flightGuestIntro')}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-4">
                <TravelerPartyNote adults={adults} children={children} infants={infants} />
                <p className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-body text-brand-800">
                  {tp(international ? 'internationalPassportNote' : 'domesticPhotoIdNote')}
                </p>
                {errors.party ? <p className="text-body text-error-600">{errors.party}</p> : null}
                {sized.map((passenger, index) => (
                  <div key={passenger.id} className="border border-neutral-300 bg-white p-5">
                    <PassengerForm
                      passenger={passenger}
                      index={index}
                      onChange={(updated) => handleChange(index, updated)}
                      requireId={identity.requireId}
                      includeInfant={infants > 0}
                      allowedIdTypes={identity.allowedIdTypes}
                      nameLabel={international ? tp('fullNameAsOnPassport') : undefined}
                      idNumberLabel={international ? tp('passportNumberLabel') : undefined}
                      idNumberPlaceholder={international ? tp('enterPassportNumber') : undefined}
                      errors={{
                        name: errors[`name_${index}`],
                        email: errors[`email_${index}`],
                        phone: errors[`phone_${index}`],
                        gender: errors[`gender_${index}`],
                        category: errors[`category_${index}`],
                        idType: errors[`idtype_${index}`],
                        idNumber: errors[`idnum_${index}`],
                        idCountry: errors[`idcountry_${index}`],
                      }}
                    />
                  </div>
                ))}
              </div>
              <aside className="h-fit border border-neutral-300 bg-white p-5">
                <h2 className="text-listing font-semibold text-neutral-900">{tp('flightSummary')}</h2>
                <div className="mt-3 flex items-start gap-3">
                  {offer.itinerary[0] ? (
                    <AirlineLogo
                      code={displayAirline(offer.itinerary[0]).code}
                      fallbackCode={offer.itinerary[0].carrier}
                      name={marketingLabel(offer)}
                      size="sm"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-body font-medium text-neutral-900">{marketingLabel(offer)}</p>
                    <p className="mt-1 text-meta text-neutral-600">{flightNumbers(offer)}</p>
                    {cabinLine(offer) ? <p className="mt-1 text-meta text-neutral-600">{cabinLine(offer)}</p> : null}
                  </div>
                </div>
                {params.date ? (
                  <p className="mt-2 text-meta text-neutral-600">
                    {tp('flightOutbound')}: {formatDate(params.date)}
                  </p>
                ) : null}
                {params.returnDate ? (
                  <p className="text-meta text-neutral-600">
                    {tp('flightReturn')}: {formatDate(params.returnDate)}
                  </p>
                ) : null}
                {journey.inbound.length ? (
                  <p className="mt-2 text-meta text-neutral-600">
                    {journey.outbound[0]?.origin} → {journey.outbound[journey.outbound.length - 1]?.destination}
                    {' · '}
                    {journey.inbound[0]?.origin} → {journey.inbound[journey.inbound.length - 1]?.destination}
                  </p>
                ) : null}
                <div className="mt-4">
                  <FlightFareFacts offer={offer} compact />
                </div>
                <p className="mt-5 text-meta leading-relaxed text-neutral-600">{tp('flightNextDocumentedSteps')}</p>
                <div className="mt-3">
                  <FlightCheckoutSteps current="passengers" />
                </div>
                <button type="button" className="btn-primary mt-5 w-full" onClick={handleContinue}>
                  {tp('continueToReview')}
                </button>
                <p className="mt-3 text-meta leading-relaxed text-neutral-600">{tp('flightReservationNotOpen')}</p>
              </aside>
            </div>
          </div>
        </>
      )}
    </QueryFeedback>
  );
}
