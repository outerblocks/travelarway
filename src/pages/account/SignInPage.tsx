import { useState } from 'react';
import { Link, useNavigate } from '@/router';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SocialLoginButtons } from '@/components/shared/SocialLoginButtons';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export function SignInPage() {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();
  const { tp } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left branding panel — equal 50% width, hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-brand-900/90 to-brand-800" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-brand-600/15 blur-3xl" />
        <div className="absolute top-0 left-1/2 h-[300px] w-[300px] rounded-full bg-accent/8 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex">
            <Logo size="lg" variant="light" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Your journey
              <br />
              <span className="text-accent">starts here</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/65 leading-relaxed">
              Book buses, ferries, flights, trains, stays, and experiences across Tanzania and beyond, all in one place.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/30">
            <span className="font-semibold text-white/50">Travelar</span>
            {' '}· Multimodal Travel Booking Platform
          </p>
        </div>
      </div>

      {/* Right auth panel — equal 50% */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link to="/" className="inline-flex justify-center"><Logo size="lg" /></Link>
          </div>

          <div className="card p-8">
            <h1 className="mb-2 font-display text-page font-bold text-ink">{tp('signInTitle')}</h1>
            <p className="mb-6 text-body text-neutral-500">{tp('signInWelcome')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="signin_email" className="input-label">{tp('emailLabel')}</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input id="signin_email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} className="input-field pl-10" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="signin_password" className="input-label">{tp('passwordLabel')}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input id="signin_password" name="password" type="password" autoComplete="current-password" className="input-field pl-10" placeholder={tp('enterPassword')} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-body text-error-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? tp('signingIn') : tp('signInTitle')} <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6">
              <SocialLoginButtons disabled={loading} />
            </div>

            <div className="mt-6 text-center">
              <p className="text-body text-neutral-500">{tp('dontHaveAccount')} <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">{tp('createOne')}</Link></p>
            </div>
            <div className="mt-4 text-center">
              <Link to="/manage-booking" className="text-meta text-neutral-500 hover:text-brand-600">{tp('manageBookingNoAccount')}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
