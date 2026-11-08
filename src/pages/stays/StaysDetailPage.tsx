import { useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { Link, useNavigate } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import type { PublicStayOffer, PublicStayReview, PublicStayRoom } from '@/domain/stay-offer';
import { ErrorState, LoadingState, QueryFeedback, SearchSummaryBar } from '@/components/shared/States';
import { StayGallery } from '@/components/stays/StayGallery';
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
      loading={(
        <>
          <SearchSummaryBar>
            <Link to="/stays/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
          </SearchSummaryBar>
          <LoadingState count={2} message={tp('loadingStayDetails')} />
        </>
      )}
    >
    <>
      <SearchSummaryBar>
        <Link to="/stays/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
        <span className="text-body font-medium text-neutral-900">{offer?.name ?? tp('stays')}</span>
      </SearchSummaryBar>
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
  const { tp } = useI18n();
  const navigate = useNavigate();
  const { bookingState, setSearchParams, setSelectedClassId } = useApp();
  const [selectedId, setSelectedId] = useState(offer.rooms[0]?.id ?? '');
  const selected = offer.rooms.find((room) => room.id === selectedId) ?? offer.rooms[0] ?? null;
  const guestLabel = [
    tp('adultCount').replace('{count}', String(adults)).replace('{plural}', adults === 1 ? '' : 's'),
    children > 0 ? tp('childrenCount').replace('{count}', String(children)).replace('{plural}', children === 1 ? '' : 's') : null,
  ].filter(Boolean).join(', ');

  const continueBooking = () => {
    if (!selected) return;
    setSelectedClassId(selected.id);
    setSearchParams({
      ...bookingState.searchParams,
      extras: {
        ...bookingState.searchParams.extras,
        stayOfferId: offer.id,
        stayRoomId: selected.id,
        stayRoomName: selected.name,
      },
    });
    navigate(`/stays/booking?offer=${encodeURIComponent(offer.id)}`);
  };

  return (
    <div className="section-container py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
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
          {offer.amenities.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {offer.amenities.map((amenity) => (
                <li key={amenity} className="rounded-md bg-neutral-100 px-2.5 py-1 text-label text-neutral-700">
                  {amenity}
                </li>
              ))}
            </ul>
          ) : null}

          <section className="mt-8">
            <h2 className="text-listing font-semibold text-neutral-900">{tp('availableRooms')}</h2>
            <p className="mt-1 text-meta text-neutral-600">{tp('stayRatesLive')}</p>
            {offer.rooms.length === 0 ? (
              <p className="mt-4 text-body text-neutral-600">{tp('stayNoRooms')}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {offer.rooms.map((room) => (
                  <StayRoomRow
                    key={room.id}
                    room={room}
                    nights={nights}
                    selected={selected?.id === room.id}
                    onSelect={() => setSelectedId(room.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="h-fit border border-neutral-300 bg-white p-5">
          <h2 className="text-listing font-semibold text-neutral-900">{tp('yourStay')}</h2>
          <dl className="mt-4 space-y-3 text-body text-neutral-700">
            {checkIn ? (
              <div>
                <dt className="text-meta text-neutral-500">{tp('checkIn')}</dt>
                <dd>{formatDate(checkIn)}</dd>
              </div>
            ) : null}
            {checkOut ? (
              <div>
                <dt className="text-meta text-neutral-500">{tp('checkOut')}</dt>
                <dd>{formatDate(checkOut)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-meta text-neutral-500">{tp('guests')}</dt>
              <dd>{guestLabel}</dd>
            </div>
            <div>
              <dt className="text-meta text-neutral-500">{tp('rooms')}</dt>
              <dd>{rooms} {tp(rooms === 1 ? 'roomSingular' : 'roomPlural')}</dd>
            </div>
            <div>
              <dt className="text-meta text-neutral-500">{tp('nights')}</dt>
              <dd>{nightLabel}</dd>
            </div>
            {selected ? (
              <div>
                <dt className="text-meta text-neutral-500">{tp('selectRoom')}</dt>
                <dd>{selected.name}</dd>
              </div>
            ) : null}
          </dl>
          {selected?.totalPrice != null && selected.currency ? (
            <p className="mt-5 text-listing font-semibold tabular-nums text-brand-800">
              {formatMoney(selected.totalPrice, selected.currency)}
              <span className="ml-2 text-meta font-normal text-neutral-500">{tp('forThisStay')}</span>
            </p>
          ) : null}
          <button type="button" className="btn-primary mt-5 w-full" disabled={!selected} onClick={continueBooking}>
            {tp('continueStayBooking')}
          </button>
          <p className="mt-3 text-meta leading-relaxed text-neutral-600">{tp('stayBookingNotOpen')}</p>
        </aside>
      </div>
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
  selected,
  onSelect,
}: {
  room: PublicStayRoom;
  nights: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { tp } = useI18n();
  const perNight = room.totalPrice != null && nights > 0 ? room.totalPrice / nights : null;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full border p-4 text-left ${selected ? 'border-brand-600 bg-brand-50' : 'border-neutral-300 bg-white'}`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-body font-semibold text-neutral-900">{room.name}</p>
            {room.description ? <p className="mt-1 text-meta text-neutral-600">{room.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-meta text-neutral-600">
              {room.board ? <span>{room.board}</span> : null}
              {room.refundable === true ? <span>{tp('refundable')}</span> : null}
              {room.refundable === false ? <span>{tp('nonRefundable')}</span> : null}
              {room.occupancy != null ? <span>{tp('maxOccupancy').replace('{count}', String(room.occupancy))}</span> : null}
            </div>
            {room.cancellation ? <p className="mt-2 text-meta leading-relaxed text-neutral-600">{room.cancellation}</p> : null}
          </div>
          <div className="shrink-0 sm:text-right">
            {room.totalPrice != null && room.currency ? (
              <>
                <p className="text-listing font-semibold tabular-nums text-brand-800">{formatMoney(room.totalPrice, room.currency)}</p>
                <p className="text-meta text-neutral-500">{tp('forThisStay')}</p>
                {perNight != null ? (
                  <p className="mt-1 text-meta tabular-nums text-neutral-600">
                    {formatMoney(perNight, room.currency)} {tp('perNight')}
                  </p>
                ) : null}
              </>
            ) : null}
            <p className="mt-2 text-label font-medium text-brand-700">{selected ? tp('selected') : tp('selectRoom')}</p>
          </div>
        </div>
      </button>
    </li>
  );
}
