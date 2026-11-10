import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@tanstack/react-router';
import { Link, useNavigate } from '@/router';
import { Ship, Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

const CONSOLE_PATH = '/operator/bus';

/**
 * OIMS — Operator Management System
 * Sign-in for the operator console (bus and ferry modes share it).
 * Intentionally isolated from the public Travelar auth flow.
 */
export function OimsSignInPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { signInWithEmail, loading: authLoading, user } = useAuth();
  const { tp } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const leaving = useRef(false);

  // Fetch the console chunk while the form is still on screen, so a successful
  // sign-in paints the console instead of the route loader.
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
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            Powered by{' '}
            <span className="font-semibold text-white/50">Travelar Platform</span>
            {' '}· Operator Operations Portal v2.0
          </p>
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* Mobile branding */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink shadow-md">
              <Ship size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-ink">OIMS</p>
              <p className="text-[11px] text-neutral-500">Operator Management System</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 text-center">
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

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  required
                  disabled={submitting}
                  className="input-field pl-10 disabled:opacity-60"
                  placeholder="operator@company.com"
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
              This portal is exclusively for registered operators partnered with Travelar.
              If you need access, email{' '}
              <a className="text-ink underline underline-offset-2" href="mailto:partners@travelarway.com">
                partners@travelarway.com
              </a>
              {' '}or contact your account manager.
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
