import { useState } from 'react';
import { Link } from '@/router';
import { useI18n, type PublicTranslationKey } from '@/context/I18nContext';
import { findBookingByPnr, normalizePnr, operatorById, type OpsBooking } from '@/data/operations';
import { formatMoney } from '@/domain/money';

const STATUS_KEYS: Record<OpsBooking['status'], PublicTranslationKey> = {
  confirmed: 'statusConfirmed',
  pending: 'statusPending',
  cancelled: 'statusCancelled',
  refunded: 'statusRefunded',
};

/**
 * Retrieve a booking with the PNR printed on the ticket. One code works across every
 * operator, so no email or operator name is needed to find the movement.
 */
export function ManageBookingPage() {
  const { tp } = useI18n();
  const [pnr, setPnr] = useState('');
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  const [booking, setBooking] = useState<OpsBooking | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBooking(null);

    const normalised = normalizePnr(pnr);
    if (!normalised) {
      setError(tp('pleaseEnterPnr'));
      return;
    }

    // The network read is synchronous, so the answer arrives on the same paint
    // instead of a fake searching state.
    setSearched(normalised);
    setBooking(findBookingByPnr(normalised));
  };

  const Detail = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-body text-neutral-500">{label}</span>
      <span className="text-body font-medium text-neutral-900 text-right">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="section-container py-12">
        <div className="mx-auto max-w-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-label font-bold text-accent">PNR</div>
            <h1 className="mb-2 font-display text-page font-bold text-ink">{tp('manageBookingTitle')}</h1>
            <p className="text-body text-neutral-500">{tp('manageBookingDescription')}</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="manage_pnr" className="input-label">{tp('pnrLabel')}</label>
                <input
                  id="manage_pnr"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck={false}
                  className="input-field font-mono uppercase tracking-widest"
                  placeholder="TRV-AB12CD"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value)}
                />
              </div>
              {error && <p className="text-body text-error-600" role="alert">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                {tp('findBooking')}
              </button>
            </form>

            {booking && (
              <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4" role="status">
                <p className="mb-3 text-label font-semibold text-ink">
                  {tp('pnrBookingFound').replace('{pnr}', booking.pnr)}
                </p>
                <div className="space-y-1">
                  <Detail label={tp('ticketOperator')} value={operatorById(booking.operatorId)?.name ?? booking.routeLabel} />
                  <Detail label={tp('ticketRoute')} value={booking.routeLabel} />
                  <Detail label={tp('ticketDate')} value={booking.date} />
                  <Detail label={tp('checkoutPassengers')} value={String(booking.passengers)} />
                  {booking.classBooked && <Detail label={tp('ticketClass')} value={booking.classBooked} />}
                  {booking.seats.length > 0 && <Detail label={tp('seatsLabel')} value={booking.seats.join(', ')} />}
                  <Detail label={tp('checkoutTotal')} value={formatMoney(booking.amount, booking.currency)} />
                  <Detail label={tp('statusLabel')} value={tp(STATUS_KEYS[booking.status])} />
                </div>
              </div>
            )}

            {!booking && searched && (
              <div className="mt-6 p-4 rounded-sm bg-neutral-100 text-neutral-600" role="status">
                <p className="text-body">
                  {tp('noBookingFound').replace('{reference}', searched)} {tp('checkBookingReferenceAgain')}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-meta text-neutral-500 flex items-center gap-1">
                {tp('bookingReferencePrivacy')}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6">
                <Link to="/signin" className="text-body font-medium text-brand-600 hover:text-brand-700">{tp('signInToAccount')} →</Link>
                <Link to="/parcels" className="text-body font-medium text-brand-600 hover:text-brand-700">{tp('trackParcel')} →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
