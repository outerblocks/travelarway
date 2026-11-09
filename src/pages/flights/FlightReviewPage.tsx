import { useLocation } from '@tanstack/react-router';
import { Link, useNavigate } from '@/router';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { FlightCheckoutSteps } from '@/components/flights/FlightCheckoutSteps';
import { FlightFareFacts } from '@/components/flights/FlightFareFacts';
import { FlightItineraryList } from '@/components/flights/FlightItineraryList';
import { ErrorState, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { flightNumbers, iataFromPlace, marketingLabel, splitRoundTrip } from '@/domain/flight-results';
import { offerIdFromSearch } from '@/pages/stays/stay-offer-id';
import { useFlightOffer } from '@/pages/flights/useFlightOffer';

export function FlightReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingState } = useApp();
  const { tp } = useI18n();
  const params = bookingState.searchParams;
  const offerId = offerIdFromSearch(location.search) || params.extras?.flightOfferId || '';
  const { status, offer } = useFlightOffer(offerId);
  const guests = bookingState.passengers;

  return (
    <QueryFeedback
      status={status}
      errorMessage={tp('unableLoadBookingReview')}
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/flights/booking" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link>
          </SearchSummaryBar>
          <LoadingState count={2} message={tp('preparingBookingReview')} />
        </>
      )}
    >
      {!offer ? (
        <ErrorState message={tp('flightNotFound')} onRetry={() => navigate('/flights/results')} />
      ) : guests.length === 0 ? (
        <ErrorState message={tp('unableLoadBookingReview')} onRetry={() => navigate(`/flights/booking?offer=${encodeURIComponent(offerId)}`)} />
      ) : (
        <>
          <SearchSummaryBar>
            <Link to={`/flights/booking?offer=${encodeURIComponent(offer.id)}`} className="btn-ghost text-label">
              <ArrowLeft size={16} /> {tp('checkoutBack')}
            </Link>
            <span className="text-body font-medium text-neutral-900">{tp('flightBookingReview')}</span>
          </SearchSummaryBar>
          <div className="section-container py-6">
            <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <section className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-listing font-bold text-neutral-900">{tp('flightDetails')}</h2>
                    <button type="button" className="btn-ghost text-label" onClick={() => navigate('/flights/results')}>
                      <Pencil size={14} /> {tp('editButton')}
                    </button>
                  </div>
                  <p className="text-body font-medium text-neutral-900">{marketingLabel(offer)}</p>
                  <p className="mt-1 text-meta text-neutral-600">{flightNumbers(offer)}</p>
                  {offer.cabinClass || offer.fareBrand ? (
                    <p className="mt-2 text-meta text-neutral-600">{[offer.cabinClass, offer.fareBrand].filter(Boolean).join(' · ')}</p>
                  ) : null}
                  {(() => {
                    const { outbound, inbound } = splitRoundTrip(offer.itinerary, iataFromPlace(params.destination));
                    return (
                      <div className="mt-4">
                        {inbound.length ? <p className="text-meta font-medium text-neutral-500">{tp('flightOutbound')}</p> : null}
                        <FlightItineraryList offer={offer} legs={outbound} />
                        {inbound.length ? (
                          <>
                            <p className="mt-4 text-meta font-medium text-neutral-500">{tp('flightReturn')}</p>
                            <FlightItineraryList offer={offer} legs={inbound} />
                          </>
                        ) : null}
                      </div>
                    );
                  })()}
                  <p className="mt-3 text-meta leading-relaxed text-neutral-600">{tp('flightReservationNote')}</p>
                </section>
                <section className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-listing font-bold text-neutral-900">
                      {tp('passengersCount').replace('{count}', String(guests.length))}
                    </h2>
                    <button type="button" className="btn-ghost text-label" onClick={() => navigate(`/flights/booking?offer=${encodeURIComponent(offer.id)}`)}>
                      <Pencil size={14} /> {tp('editButton')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {guests.map((guest, index) => (
                      <div key={guest.id} className="flex items-start gap-4 border-b border-neutral-100 py-2 last:border-b-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-brand-50 text-meta font-bold text-brand-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-body font-medium text-neutral-900">
                            {guest.fullName}
                            {guest.category ? (
                              <span className="text-meta font-normal text-neutral-500"> · {tp(guest.category)}</span>
                            ) : null}
                          </p>
                          <p className="text-meta text-neutral-500">
                            {guest.email} · {guest.phoneCountryCode} {guest.phone}
                          </p>
                          {guest.idType ? (
                            <p className="text-meta text-neutral-500">
                              {tp(guest.idType === 'passport' ? 'passport' : guest.idType === 'national_id' ? 'nationalId' : guest.idType === 'driving_licence' ? 'drivingLicence' : 'voterCard')}
                              {guest.idNumber ? ` · ${guest.idNumber}` : ''}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <aside className="card sticky top-20 h-fit p-6">
                <h2 className="mb-4 text-listing font-bold text-neutral-900">{tp('fareSummary')}</h2>
                <FlightFareFacts offer={offer} compact />
                <p className="mt-5 text-meta leading-relaxed text-neutral-600">{tp('flightNextDocumentedSteps')}</p>
                <div className="mt-3">
                  <FlightCheckoutSteps current="review" />
                </div>
                <button type="button" className="btn-primary mt-6 w-full opacity-60" disabled>
                  {tp('proceedToCheckout')}
                </button>
                <p className="mt-4 text-center text-meta leading-relaxed text-neutral-500">{tp('flightReservationNotOpen')}</p>
              </aside>
            </div>
          </div>
        </>
      )}
    </QueryFeedback>
  );
}
