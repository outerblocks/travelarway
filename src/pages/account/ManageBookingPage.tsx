import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Search, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function ManageBookingPage() {
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
      setError('Please enter your booking reference.');
      return;
    }
    if (!email) {
      setError('Please enter the email used for the booking.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setResult({
        found: false,
        message: `No booking found with reference "${bookingRef}". Please check your reference number and try again.`,
      });
    }, 1200);
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="section-container py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} className="text-brand-600" />
            </div>
            <h1 className="text-page font-bold text-neutral-900 mb-2">Manage your booking</h1>
            <p className="text-body text-neutral-500">Retrieve your booking using your reference number and email.</p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="manage_ref" className="input-label">Booking reference</label>
                <input id="manage_ref" type="text" className="input-field" placeholder="e.g. TRV-123456" value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} />
              </div>
              <div>
                <label htmlFor="manage_email" className="input-label">Email used for booking</label>
                <input id="manage_email" type="email" className="input-field" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <p className="text-body text-error-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                <Search size={18} /> {loading ? 'Searching...' : 'Find booking'}
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded-sm ${result.found ? 'bg-accent-50 text-accent-700' : 'bg-neutral-100 text-neutral-600'}`}>
                <p className="text-body">{result.message}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-meta text-neutral-500 flex items-center gap-1">
                <Lock size={12} /> A booking reference alone does not reveal passenger information. Email verification is required.
              </p>
              <div className="mt-3">
                <Link to="/signin" className="text-body font-medium text-brand-600 hover:text-brand-700">Sign in to your account →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
