import { useState } from 'react';
import { Link } from '@/router';
import { Package, Search, MapPin } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { normalizePnr } from '@/data/operations';
import { findParcelByPnr, type ParcelMovement } from '@/data/parcels';

/**
 * Public parcel tracking. Travellers use the same PNR that is printed on their
 * ticket, so one code retrieves either a seat or a parcel.
 */
export function ParcelTrackingPage() {
  const { tp } = useI18n();
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [searched, setSearched] = useState('');
  const [movement, setMovement] = useState<ParcelMovement | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMovement(null);

    const normalised = normalizePnr(reference);
    if (!normalised) {
      setError(tp('pleaseEnterPnr'));
      return;
    }

    setSearched(normalised);
    setMovement(findParcelByPnr(normalised));
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink">
              <Package size={22} className="text-accent" />
            </div>
            <h1 className="mb-2 font-display text-page font-bold text-ink">{tp('parcelTrackingTitle')}</h1>
            <p className="text-body text-neutral-500">{tp('parcelTrackingIntro')}</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="parcel_number" className="input-label">{tp('parcelNumberLabel')}</label>
                <input
                  id="parcel_number"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  className="input-field font-mono uppercase tracking-widest"
                  placeholder="TRV-AB12CD"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              {error && <p className="text-body text-error-600" role="alert">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                <Search size={18} /> {tp('findParcel')}
              </button>
            </form>

            {movement && (
              <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4" role="status">
                <div className="space-y-1">
                  <Detail label={tp('ticketOperator')} value={movement.operatorName} />
                  <Detail label={tp('ticketRoute')} value={movement.routeLabel} />
                  <Detail label={tp('ticketDate')} value={movement.date} />
                </div>
              </div>
            )}

            {!movement && searched && (
              <div className="mt-6 p-4 rounded-sm bg-neutral-100 text-neutral-600" role="status">
                <p className="text-body">{tp('parcelNotFound').replace('{reference}', searched)}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-meta text-neutral-500 flex items-start gap-1">
                <MapPin size={12} className="mt-0.5 shrink-0" /> {tp('parcelTrackingNote')}
              </p>
              <div className="mt-3">
                <Link to="/manage-booking" className="text-body font-medium text-brand-600 hover:text-brand-700">{tp('manageBooking')} →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
