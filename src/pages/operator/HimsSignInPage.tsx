import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Link, useNavigate } from '@/router';
import { Bus, Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

const CONSOLE_PATH = '/hq';

/**
 * HIMS — Travelar HQ Internal Management System
 * Sign-in for the HQ console that oversees the whole network.
 * Intentionally isolated from the public Travelar auth flow.
 */
export function HimsSignInPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { signInWithEmail, loading: authLoading, user } = useAuth();
  const { tp } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const leaving = useRef(false);

  // Fetch the HQ console chunk while the form is still on screen.
  useEffect(() => {
    void router.preloadRoute({ to: CONSOLE_PATH });
  }, [router]);

  // An existing session goes straight to the console. Navigation belongs in an
  // effect: calling navigate during render re-renders the page and navigates again.
  useEffect(() => {
    if (!authLoading && user && !leaving.current) {
      leaving.current = true;
      navigate(CONSOLE_PATH, { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    if (!email || !password) {
      setError(tp('pleaseEnterEmailAndPassword'));
      return;
    }
    setSubmitting(true);
    const { error: authError } = await signInWithEmail(email, password);
    if (authError) {
      setSubmitting(false);
      setError(authError);
      return;
    }
    leaving.current = true;
    navigate(CONSOLE_PATH, { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-ink p-12">
        <div className="relative z-10">
          {/* Logo row */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 shadow-lg">
              <Bus size={22} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">HIMS</p>
              <p className="text-[11px] font-medium text-white/50 uppercase tracking-widest">
                HQ Internal Management System
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Travelar HQ
              <br />
              <span className="text-accent">Management Console</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/65 leading-relaxed">
              Oversee every operator, route, departure and booking across the Travelar network, all from one secure console.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Operator Oversight', desc: 'Approve or suspend operators' },
              { label: 'Network Routes', desc: 'Every configured route' },
              { label: 'Booking Oversight', desc: 'Online and counter sales' },
              { label: 'Revenue Analytics', desc: 'Network-wide reporting' },
            ].map((feat) => (
              <div
                key={feat.label}
                className="rounded-xl border border-white/15 bg-white/8 p-4"
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
            {' '}· Operator Portal v2.0
          </p>
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink shadow-md">
              <Bus size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-ink">HIMS</p>
              <p className="text-[11px] text-neutral-500">HQ Internal Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink/8">
              <ShieldCheck size={24} className="text-ink" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              HQ Sign In
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Authorised Travelar HQ staff only. Enter your credentials to access the console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="hims_email" className="input-label">
                {tp('emailLabel')}
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="hims_email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={submitting}
                  className="input-field pl-10 disabled:opacity-60"
                  placeholder="staff@travelar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="hims_password" className="input-label">
                Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="hims_password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={submitting}
                  className="input-field pl-10 disabled:opacity-60"
                  placeholder={tp('enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div aria-live="polite">
              {error && (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in…</>
              ) : (
                <>Sign In to Console <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500 leading-relaxed">
              <strong className="text-neutral-700">Restricted Access.</strong>{' '}
              This portal is exclusively for registered bus operators partnered with Travelar.
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
