import { useMemo, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Link, useNavigate } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { PassengerForm, createPassenger } from '@/components/shared/PassengerForm';
import { ErrorState, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { partyMismatched } from '@/domain/passengers';
import { roomFromOffer } from '@/domain/stay-offer';
import { formatMoney } from '@/domain/money';
import { formatDate, nightsBetween } from '@/utils/format';
import type { PassengerInfo } from '@/types';
import { offerIdFromSearch } from '@/pages/stays/stay-offer-id';
import { useStayOffer } from '@/pages/stays/useStayOffer';

export function StaysBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingState, setPassengers, setSearchParams } = useApp();
  const { tp } = useI18n();
  const params = bookingState.searchParams;
  const offerId = offerIdFromSearch(location.search) || params.extras?.stayOfferId || '';
  const { status, offer } = useStayOffer(offerId);
  const roomId = params.extras?.stayRoomId || bookingState.selectedClassId;
  const room = offer ? roomFromOffer(offer, roomId) : null;
  const adults = params.adults;
  const children = params.children;
  const totalGuests = Math.max(1, adults + children);
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;

  const [guests, setGuests] = useState<PassengerInfo[]>(() =>
    Array.from({ length: totalGuests }, () => createPassenger()),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sizedGuests = useMemo(() => {
    if (guests.length === totalGuests) return guests;
    return Array.from({ length: totalGuests }, (_, index) => guests[index] ?? createPassenger());
  }, [guests, totalGuests]);

  const handleChange = (index: number, updated: PassengerInfo) => {
    setGuests((previous) => {
      const next = [...(previous.length === totalGuests ? previous : sizedGuests)];
      next[index] = updated;
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    sizedGuests.forEach((guest, index) => {
      if (!guest.fullName.trim()) next[`name_${index}`] = tp('requiredLabel');
      if (!guest.email.trim()) next[`email_${index}`] = tp('requiredLabel');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) next[`email_${index}`] = tp('validEmailRequired');
      if (!guest.phone.trim()) next[`phone_${index}`] = tp('requiredLabel');
      if (!guest.gender) next[`gender_${index}`] = tp('requiredLabel');
      if (!guest.category) next[`category_${index}`] = tp('requiredLabel');
    });
    if (Object.keys(next).length === 0 && partyMismatched(sizedGuests, adults, children)) {
      next.party = tp('partyMixMismatch')
        .replace('{adults}', String(adults))
        .replace('{children}', String(children));
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = () => {
    if (!offer || !room || !validate()) return;
    setPassengers(sizedGuests);
    setSearchParams({
      ...params,
      extras: {
        ...params.extras,
        stayOfferId: offer.id,
        stayRoomId: room.id,
        stayRoomName: room.name,
      },
    });
    navigate(`/stays/review?offer=${encodeURIComponent(offer.id)}`);
  };

  return (
    <QueryFeedback
      status={status}
      errorMessage={tp('unableLoadStays')}
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/stays/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link>
          </SearchSummaryBar>
          <LoadingState count={2} message={tp('loadingStayDetails')} />
        </>
      )}
    >
      {!offer ? (
        <ErrorState message={tp('propertyNotFound')} onRetry={() => navigate('/stays/results')} />
      ) : !room ? (
        <ErrorState message={tp('roomNotFound')} onRetry={() => navigate(`/stays/detail?offer=${encodeURIComponent(offerId)}`)} />
      ) : (
        <>
          <SearchSummaryBar>
            <Link to={`/stays/detail?offer=${encodeURIComponent(offer.id)}`} className="btn-ghost text-label">
              <ArrowLeft size={16} /> {tp('checkoutBack')}
            </Link>
            <span className="text-body font-medium text-neutral-900">{offer.name}</span>
          </SearchSummaryBar>
          <div className="section-container py-6">
            <h1 className="text-page font-bold text-neutral-900">{tp('guestInformation')}</h1>
            <p className="mt-2 max-w-2xl text-body text-neutral-600">{tp('stayGuestIntro')}</p>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-4">
                {errors.party ? <p className="text-body text-error-600">{errors.party}</p> : null}
                {sizedGuests.map((guest, index) => (
                  <div key={guest.id} className="border border-neutral-300 bg-white p-5">
                    <PassengerForm
                      passenger={guest}
                      index={index}
                      onChange={(updated) => handleChange(index, updated)}
                      showIdentification={false}
                      errors={{
                        name: errors[`name_${index}`],
                        email: errors[`email_${index}`],
                        phone: errors[`phone_${index}`],
                        gender: errors[`gender_${index}`],
                        category: errors[`category_${index}`],
                      }}
                    />
                  </div>
                ))}
              </div>
              <aside className="h-fit border border-neutral-300 bg-white p-5">
                <h2 className="text-listing font-semibold text-neutral-900">{tp('yourStay')}</h2>
                <p className="mt-3 text-body font-medium text-neutral-900">{offer.name}</p>
                <p className="mt-1 text-meta text-neutral-600">{room.name}</p>
                {params.date && params.extras?.checkOut ? (
                  <p className="mt-2 text-meta text-neutral-600">
                    {formatDate(params.date)} – {formatDate(params.extras.checkOut)}
                    {' · '}
                    {tp('nightCount').replace('{count}', String(Math.max(nights, 1))).replace('{plural}', nights === 1 ? '' : 's')}
                  </p>
                ) : null}
                {room.totalPrice != null && room.currency ? (
                  <p className="mt-4 text-listing font-semibold tabular-nums text-brand-800">
                    {formatMoney(room.totalPrice, room.currency)}
                  </p>
                ) : null}
                <button type="button" className="btn-primary mt-5 w-full" onClick={handleContinue}>
                  {tp('continueToReview')}
                </button>
              </aside>
            </div>
          </div>
        </>
      )}
    </QueryFeedback>
  );
}
