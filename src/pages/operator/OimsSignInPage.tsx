import { useState } from 'react';
import { Link, useNavigate } from '@/router';
import { Ship, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

/**
 * OIMS — Operator Management System
 * Dedicated sign-in page for Ferry Operator console access.
 * Intentionally isolated from the public Travelar auth flow.
 */
export function OimsSignInPage() {
  const navigate = useNavigate();
  const { signInWithEmail, loading: authLoading, user } = useAuth();
  const { tp } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in → go straight to the console
  if (!authLoading && user) {
    navigate('/operator/bus', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(tp('pleaseEnterEmailAndPassword'));
      return;
    }
    setLoading(true);
    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    navigate('/operator/bus');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-brand-900/90 to-brand-800" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-brand-600/15 blur-3xl" />
        <div className="absolute top-0 left-1/2 h-[300px] w-[300px] rounded-full bg-accent/8 blur-3xl" />

        <div className="relative z-10">
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
              <Ship size={22} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">OIMS</p>
              <p className="text-[11px] font-medium text-white/50 uppercase tracking-widest">
                Operator Management System
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Operator
              <br />
              <span className="text-accent">Management Console</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/65 leading-relaxed">
              Control routes, segment fares, schedules, fleet and passenger manifests from one secure console.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Voyage Schedules', desc: 'Manage all ferry routes' },
              { label: 'Vessel Management', desc: 'Track your entire fleet' },
              { label: 'Passenger Manifest', desc: 'Resident & non-resident' },
              { label: 'Port Analytics', desc: 'Revenue and occupancy data' },
            ].map((feat) => (
              <div
                key={feat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-white">{feat.label}</p>
                <p className="mt-0.5 text-xs text-white/50">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            Powered by{' '}
            <span className="font-semibold text-white/50">Travelar Platform</span>
            {' '}· Marine Operations Portal v2.0
          </p>
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-[400px]">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink shadow-md">
              <Ship size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-ink">OIMS</p>
              <p className="text-[11px] text-neutral-500">Ocean & Inland Marine System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink/8">
              <ShieldCheck size={24} className="text-ink" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              Operator Sign In
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Authorised operators only. Enter your credentials to access the console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="oims_email" className="input-label">
                Operator Email
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="oims_email"
                  type="email"
                  autoComplete="email"
                  className="input-field pl-10"
                  placeholder="operator@ferrycompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="oims_password" className="input-label">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="oims_password"
                  type="password"
                  autoComplete="current-password"
                  className="input-field pl-10"
                  placeholder={tp('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in…' : 'Sign In to Console'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              <strong className="text-neutral-700">Restricted Access.</strong>{' '}
              This portal is exclusively for registered operators partnered with Travelar.
              If you need access, contact your account manager.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              ← Back to Travelar public site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
