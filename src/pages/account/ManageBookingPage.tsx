import { useState } from 'react';
import { Link } from '@/router';
import { Ticket, Search, Lock } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';

export function ManageBookingPage() {
  const { tp } = useI18n();
  const [bookingRef, setBookingRef] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<null | { found: boolean; message: string }>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!bookingRef) {
      setError(tp('pleaseEnterBookingReference'));
      return;
    }
    if (!email) {
      setError(tp('pleaseEnterBookingEmail'));
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult({
        found: false,
        message: `${tp('noBookingFound').replace('{reference}', bookingRef)} ${tp('checkBookingReferenceAgain')}`,
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="section-container py-12">
        <div className="mx-auto max-w-lg">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink">
              <Ticket size={22} className="text-accent" />
            </div>
            <h1 className="mb-2 font-display text-page font-bold text-ink">{tp('manageBookingTitle')}</h1>
            <p className="text-body text-neutral-500">{tp('manageBookingDescription')}</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="manage_ref" className="input-label">{tp('bookingReferenceLabel')}</label>
                <input id="manage_ref" type="text" className="input-field" placeholder="e.g. TRV-123456" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
              </div>
              <div>
                <label htmlFor="manage_email" className="input-label">{tp('emailUsedForBooking')}</label>
                <input id="manage_email" type="email" className="input-field" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <p className="text-body text-error-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                <Search size={18} /> {loading ? tp('searchingBooking') : tp('findBooking')}
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded-sm ${result.found ? 'bg-accent-50 text-accent-700' : 'bg-neutral-100 text-neutral-600'}`}>
                <p className="text-body">{result.message}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-meta text-neutral-500 flex items-center gap-1">
                <Lock size={12} /> {tp('bookingReferencePrivacy')}
              </p>
              <div className="mt-3">
                <Link to="/signin" className="text-body font-medium text-brand-600 hover:text-brand-700">{tp('signInToAccount')} →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
