import { useLocation } from '@tanstack/react-router';
import { useNavigate } from '@/router';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import type { PublicStayOffer, PublicStayReview, PublicStayRoom } from '@/domain/stay-offer';
import { ErrorState, LoadingState, QueryFeedback } from '@/components/shared/States';
import { StayAmenityList } from '@/components/stays/StayAmenityList';
import { StayGallery } from '@/components/stays/StayGallery';
import { StayPhoto } from '@/components/stays/StayPhoto';
import { StayStars } from '@/components/stays/StayStars';
import { formatMoney } from '@/domain/money';
import { formatDate, nightsBetween } from '@/utils/format';
import { offerIdFromSearch } from '@/pages/stays/stay-offer-id';
import { useStayOffer } from '@/pages/stays/useStayOffer';

export function StaysDetailPage() {
  const { tp } = useI18n();
  const { bookingState } = useApp();
  const location = useLocation();
  const params = bookingState.searchParams;
  const offerId = offerIdFromSearch(location.search);
  const { status, offer } = useStayOffer(offerId);
  const nights = params.date && params.extras?.checkOut ? nightsBetween(params.date, params.extras.checkOut) : 1;
  const nightLabel = tp('nightCount').replace('{count}', String(Math.max(nights, 1))).replace('{plural}', nights === 1 ? '' : 's');
  const roomCount = Number(params.extras?.rooms ?? 1);

  return (
    <QueryFeedback
      status={status}
      errorMessage={tp('unableLoadStays')}
      loading={<LoadingState count={2} message={tp('loadingStayDetails')} />}
    >
    <>
      {!offer ? (
        <ErrorState message={tp('propertyNotFound')} />
      ) : (
        <StayDetailBody
          offer={offer}
          nights={Math.max(nights, 1)}
          nightLabel={nightLabel}
          rooms={Number.isFinite(roomCount) && roomCount > 0 ? roomCount : 1}
          checkIn={params.date}
          checkOut={params.extras?.checkOut}
          adults={params.adults}
          children={params.children}
        />
      )}
    </>
    </QueryFeedback>
  );
}

function StayDetailBody({
  offer,
  nights,
  nightLabel,
  rooms,
  checkIn,
  checkOut,
  adults,
  children,
}: {
  offer: PublicStayOffer;
  nights: number;
  nightLabel: string;
  rooms: number;
  checkIn?: string;
  checkOut?: string;
  adults: number;
  children: number;
}) {
  const { tp, lang } = useI18n();
  const navigate = useNavigate();
  const { bookingState, setSearchParams, setSelectedClassId } = useApp();
  const guestLabel = [
    tp('adultCount').replace('{count}', String(adults)).replace('{plural}', adults === 1 ? '' : 's'),
    children > 0 ? tp('childrenCount').replace('{count}', String(children)).replace('{plural}', children === 1 ? '' : 's') : null,
  ].filter(Boolean).join(', ');
  const stayFacts = [
    checkIn ? formatDate(checkIn) : null,
    checkOut ? formatDate(checkOut) : null,
    guestLabel,
    `${rooms} ${tp(rooms === 1 ? 'roomSingular' : 'roomPlural')}`,
    nightLabel,
  ].filter(Boolean).join(' · ');

  const continueBooking = (room: PublicStayRoom) => {
    setSelectedClassId(room.id);
    setSearchParams({
      ...bookingState.searchParams,
      extras: {
        ...bookingState.searchParams.extras,
        stayOfferId: offer.id,
        stayRoomId: room.id,
        stayRoomName: room.name,
      },
    });
    navigate(`/stays/booking?offer=${encodeURIComponent(offer.id)}`);
  };

  return (
    <div className="section-container py-6">
      <StayGallery urls={offer.photoUrls} name={offer.name} />

      <h1 className="mt-5 text-page font-bold text-neutral-900">{offer.name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {offer.starRating != null ? <StayStars rating={offer.starRating} label={tp('starRated').replace('{count}', String(offer.starRating))} /> : null}
        <p className="text-body text-neutral-600">{offer.address || offer.location}</p>
      </div>
      {offer.distance ? (
        <p className="mt-1 text-meta text-neutral-500">{tp('distanceFromSearch').replace('{distance}', offer.distance)}</p>
      ) : null}
      {offer.description ? (
        <p className="mt-5 max-w-3xl text-body leading-relaxed text-neutral-700">{offer.description}</p>
      ) : null}
      <StayGuestReviews reviews={offer.reviews} />
      <StayAmenityList amenities={offer.amenities} lang={lang} variant="grid" />

      <section className="mt-8">
        <h2 className="text-listing font-semibold text-neutral-900">{tp('availableRooms')}</h2>
        {stayFacts ? <p className="mt-1 text-meta text-neutral-600">{stayFacts}</p> : null}
        {offer.rooms.length === 0 ? (
          <p className="mt-4 text-body text-neutral-600">{tp('stayNoRooms')}</p>
        ) : (
          <ul className="stay-rate-list mt-4">
            {offer.rooms.map((room) => (
              <StayRoomRow
                key={room.id}
                room={room}
                nights={nights}
                onBook={() => continueBooking(room)}
              />
            ))}
          </ul>
        )}
        <p className="mt-4 text-meta leading-relaxed text-neutral-600">{tp('stayBookingNotOpen')}</p>
      </section>
    </div>
  );
}

function StayGuestReviews({ reviews }: { reviews: PublicStayReview[] }) {
  const { tp } = useI18n();
  return (
    <section className="mt-8">
      <h2 className="text-listing font-semibold text-neutral-900">{tp('stayGuestReviews')}</h2>
      {reviews.length === 0 ? (
        <p className="mt-2 max-w-3xl text-body leading-relaxed text-neutral-600">{tp('stayGuestReviewsUnavailable')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {reviews.map((review, index) => (
            <li key={`${review.date ?? 'review'}-${index}`} className="border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {review.author ? <p className="text-body font-medium text-neutral-900">{review.author}</p> : null}
                {review.score != null ? <p className="text-meta tabular-nums text-neutral-600">{review.score}</p> : null}
                {review.date ? <p className="text-meta text-neutral-500">{review.date}</p> : null}
              </div>
              <p className="mt-2 text-body leading-relaxed text-neutral-700">{review.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StayRoomRow({
  room,
  nights,
  onBook,
}: {
  room: PublicStayRoom;
  nights: number;
  onBook: () => void;
}) {
  const { tp } = useI18n();
  const perNight = room.totalPrice != null && nights > 0 ? room.totalPrice / nights : null;
  const facts = [
    room.occupancy != null ? tp('maxOccupancy').replace('{count}', String(room.occupancy)) : null,
    room.refundable === true ? tp('refundable') : null,
    room.refundable === false ? tp('nonRefundable') : null,
    room.board || null,
  ].filter(Boolean).join(' · ');
  const canBook = room.totalPrice != null && Boolean(room.currency);
  return (
    <li className={`stay-rate-row${room.photoUrls.length ? ' has-photo' : ''}`}>
      {room.photoUrls.length ? (
        <StayPhoto urls={room.photoUrls} name={room.name} className="h-[7.5rem] w-full sm:h-[7.5rem] sm:w-[7.5rem]" />
      ) : null}
      <div className="min-w-0">
        <p className="text-body font-semibold text-neutral-900">{room.name}</p>
        {facts ? <p className="mt-1 text-meta text-neutral-600">{facts}</p> : null}
        {room.description ? <p className="mt-1 text-meta text-neutral-600">{room.description}</p> : null}
      </div>
      <div className="shrink-0 sm:text-right">
        {canBook ? (
          <>
            <p className="text-listing font-semibold tabular-nums text-neutral-900">{formatMoney(room.totalPrice!, room.currency!)}</p>
            {perNight != null ? (
              <p className="mt-0.5 text-meta tabular-nums text-neutral-600">
                {formatMoney(perNight, room.currency!)} {tp('perNight')}
              </p>
            ) : null}
          </>
        ) : null}
        <button type="button" className="btn-primary mt-3 px-4 py-2 text-label" disabled={!canBook} onClick={onBook}>
          {tp('continueStayBooking')}
        </button>
      </div>
    </li>
  );
}
