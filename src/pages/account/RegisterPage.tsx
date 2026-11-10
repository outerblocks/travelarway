import { useState } from 'react';
import { Link, useNavigate } from '@/router';
import { Logo } from '@/components/ui/Logo';
import { SocialLoginButtons } from '@/components/shared/SocialLoginButtons';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export function RegisterPage() {
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const { tp } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!fullName || !email || !password) {
      setError(tp('requiredFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(tp('passwordsDoNotMatch'));
      return;
    }
    if (password.length < 8) {
      setError(tp('passwordMinLength'));
      return;
    }
    setLoading(true);
    const { error: authError } = await signUpWithEmail(email, password, fullName);
    if (authError) {
      setLoading(false);
      setError(authError);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-ink p-12">
        <div className="relative z-10">
          <Link to="/" className="inline-flex">
            <Logo size="lg" variant="light" />
          </Link>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Join millions of
              <br />
              <span className="text-accent">happy travellers</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-white/65 leading-relaxed">
              Create your free Travelar account and get access to exclusive deals, instant booking, and seamless travel across East Africa and beyond.
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

      <div className="flex w-full flex-col items-center justify-center px-5 py-8 sm:px-6 sm:py-12 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center lg:hidden">
            <Link to="/" className="inline-flex justify-center"><Logo size="lg" /></Link>
          </div>

          <div className="card p-6 sm:p-8">
            <h1 className="mb-2 text-center font-display text-page font-bold text-ink">{tp('createAccountTitle')}</h1>
            <p className="text-center text-body text-neutral-500 mb-6">{tp('registerIntro')}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reg_name" className="input-label">{tp('fullNameLabel')}</label>
                <div>
                  <input id="reg_name" name="name" type="text" autoComplete="name" className="input-field" placeholder={tp('enterFullNamePlaceholder')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="reg_email" className="input-label">{tp('emailLabel')}</label>
                <div>
                  <input id="reg_email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} className="input-field" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="reg_password" className="input-label">{tp('passwordLabel')}</label>
                <div>
                  <input id="reg_password" name="password" type="password" autoComplete="new-password" className="input-field" placeholder={tp('atLeastSixChars')} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="reg_confirm" className="input-label">{tp('confirmPasswordLabel')}</label>
                <div>
                  <input id="reg_confirm" name="confirmPassword" type="password" autoComplete="new-password" className="input-field" placeholder={tp('reenterPassword')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-body text-error-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? tp('creatingAccount') : tp('createAccountTitle')}
              </button>
            </form>

            <div className="mt-6">
              <SocialLoginButtons disabled={loading} />
            </div>

            <div className="mt-6 text-center">
              <p className="text-body text-neutral-500">{tp('alreadyHaveAccount')} <Link to="/signin" className="text-brand-600 font-medium hover:text-brand-700">{tp('signInTitle')}</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
