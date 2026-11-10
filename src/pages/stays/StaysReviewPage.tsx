import { useLocation } from '@tanstack/react-router';
import { useNavigate } from '@/router';
import { Pencil } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { ErrorState, LoadingState, QueryFeedback } from '@/components/shared/States';
import { roomFromOffer } from '@/domain/stay-offer';
import { formatMoney } from '@/domain/money';
import { formatDate, nightsBetween } from '@/utils/format';
import { offerIdFromSearch } from '@/pages/stays/stay-offer-id';
import { useStayOffer } from '@/pages/stays/useStayOffer';

export function StaysReviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingState } = useApp();
  const { tp } = useI18n();
  const params = bookingState.searchParams;
  const offerId = offerIdFromSearch(location.search) || params.extras?.stayOfferId || '';
  const { status, offer } = useStayOffer(offerId);
  const room = offer ? roomFromOffer(offer, params.extras?.stayRoomId || bookingState.selectedClassId) : null;
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
  const guests = bookingState.passengers;

  return (
    <QueryFeedback
      status={status}
      errorMessage={tp('unableLoadBookingReview')}
      loading={<LoadingState count={2} message={tp('preparingBookingReview')} />}
    >
      {!offer ? (
        <ErrorState message={tp('propertyNotFound')} onRetry={() => navigate('/stays/results')} />
      ) : !room ? (
        <ErrorState message={tp('roomNotFound')} onRetry={() => navigate(`/stays/detail?offer=${encodeURIComponent(offerId)}`)} />
      ) : guests.length === 0 ? (
        <ErrorState message={tp('unableLoadBookingReview')} onRetry={() => navigate(`/stays/booking?offer=${encodeURIComponent(offerId)}`)} />
      ) : (
        <>
          <div className="section-container py-6">
            <h1 className="text-page font-bold text-neutral-900 mb-6">{tp('reviewYourBooking')}</h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <section className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-listing font-bold text-neutral-900">{tp('yourStay')}</h2>
                    <button type="button" className="btn-ghost text-label" onClick={() => navigate(`/stays/detail?offer=${encodeURIComponent(offer.id)}`)}>
                      <Pencil size={14} /> {tp('editButton')}
                    </button>
                  </div>
                  <p className="text-body font-medium text-neutral-900">{offer.name}</p>
                  <p className="mt-1 text-meta text-neutral-600">{offer.address || offer.location}</p>
                  <p className="mt-3 text-body text-neutral-800">{room.name}</p>
                  {room.description ? <p className="mt-1 text-meta text-neutral-600">{room.description}</p> : null}
                  {params.date && params.extras?.checkOut ? (
                    <p className="mt-3 text-body text-neutral-700">
                      {formatDate(params.date)} – {formatDate(params.extras.checkOut)}
                      {' · '}
                      {tp('nightCount').replace('{count}', String(Math.max(nights, 1))).replace('{plural}', nights === 1 ? '' : 's')}
                    </p>
                  ) : null}
                  {room.cancellation ? <p className="mt-3 text-meta leading-relaxed text-neutral-600">{room.cancellation}</p> : null}
                </section>
                <section className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-listing font-bold text-neutral-900">
                      {tp('passengersCount').replace('{count}', String(guests.length))}
                    </h2>
                    <button type="button" className="btn-ghost text-label" onClick={() => navigate(`/stays/booking?offer=${encodeURIComponent(offer.id)}`)}>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <aside className="card sticky top-20 h-fit p-6">
                <h2 className="mb-4 text-listing font-bold text-neutral-900">{tp('priceSummary')}</h2>
                {room.totalPrice != null && room.currency ? (
                  <div className="flex justify-between border-t border-neutral-200 pt-4">
                    <span className="text-listing font-bold text-neutral-900">{tp('checkoutTotal')}</span>
                    <span className="text-listing font-bold tabular-nums text-neutral-900">
                      {formatMoney(room.totalPrice, room.currency)}
                    </span>
                  </div>
                ) : null}
                <button type="button" className="btn-primary mt-6 w-full opacity-60" disabled>
                  {tp('proceedToCheckout')}
                </button>
                <p className="mt-4 text-center text-meta leading-relaxed text-neutral-500">{tp('stayReservationNotOpen')}</p>
              </aside>
            </div>
          </div>
        </>
      )}
    </QueryFeedback>
  );
}
