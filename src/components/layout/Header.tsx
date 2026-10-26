import { useState } from 'react';
import { Link } from '@/router';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN', fullLabel: 'English' },
  { value: 'sw', label: 'SW', fullLabel: 'Kiswahili' },
  { value: 'fr', label: 'FR', fullLabel: 'Français' },
] as const;

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { bookingState, resetBooking } = useApp();
  const { lang, setLang, tp } = useI18n();

  const handleSignOut = async () => {
    await signOut();
    // Drop the in-memory booking, so passenger names, emails and phone numbers
    // do not survive a sign-out on a shared device.
    resetBooking(bookingState.mode);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/8 bg-white/90 backdrop-blur-md">
      <div className="h-0.5 w-full bg-accent" />
      <div className="section-container">
        <div className="flex h-[4.25rem] items-center justify-between">
          <Link to="/" className="flex-shrink-0" aria-label="Travelar home">
            <Logo size="md" />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {/* Language switcher — clean pill style, no icon */}
            <div className="relative">
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value as typeof lang)}
                aria-label={tp('languageLabel')}
                className="h-9 cursor-pointer appearance-none rounded-full border border-neutral-200 bg-neutral-50 pl-3 pr-7 text-label font-semibold text-ink hover:bg-neutral-100 transition-colors outline-none"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.fullLabel}</option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            </div>

            <Link to="/help" className="btn-ghost text-label">
              {tp('help')}
            </Link>
            <Link to="/manage-booking" className="btn-ghost text-label">
              {tp('manageBooking')}
            </Link>
            {user ? (
              <div className="ml-2 flex items-center gap-1">
                <Link to="/dashboard" className="btn-ghost text-label">
                  {tp('dashboard')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-label px-4 py-2"
                >
                  <LogOut size={16} />
                  {tp('signOut')}
                </button>
              </div>
            ) : (
              <Link to="/signin" className="btn-primary ml-2 text-label px-5 py-2">
              {tp('signIn')}
              </Link>
            )}
          </div>

          <button
            className="p-2 text-ink lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={tp('toggleMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink/8 bg-white lg:hidden">
          <div className="section-container py-4">
            <div className="flex flex-col gap-2">
              {/* Mobile language switcher — clean full-width pill */}
              <div className="relative">
                <select
                  value={lang}
                  onChange={(event) => setLang(event.target.value as typeof lang)}
                  aria-label={tp('languageLabel')}
                  className="w-full h-11 cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white pl-4 pr-8 text-body font-medium text-ink outline-none"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.fullLabel}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              </div>

              <Link to="/help" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                {tp('help')}
              </Link>
              <Link to="/manage-booking" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                {tp('manageBooking')}
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                    {tp('dashboard')}
                  </Link>
                  <button onClick={handleSignOut} className="btn-secondary justify-start">
                    <LogOut size={18} />
                    {tp('signOut')}
                  </button>
                </>
              ) : (
                <Link to="/signin" className="btn-primary" onClick={() => setMobileOpen(false)}>
                  {tp('signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
