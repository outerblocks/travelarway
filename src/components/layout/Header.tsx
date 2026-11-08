import { useState } from 'react';
import { Link } from '@/router';
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
    resetBooking(bookingState.mode);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="section-container">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex-shrink-0" aria-label="Travelar home">
            <Logo size="md" />
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            <Link
              to="/help"
              className="text-label font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {tp('help')}
            </Link>
            <Link
              to="/parcels"
              className="text-label font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {tp('trackParcel')}
            </Link>
            <Link
              to="/manage-booking"
              className="text-label font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {tp('manageBooking')}
            </Link>

            <span className="h-5 w-px bg-neutral-200" aria-hidden="true" />

            {/* Language switcher */}
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value as typeof lang)}
              aria-label={tp('languageLabel')}
              className="h-8 cursor-pointer appearance-none rounded border border-neutral-200 bg-neutral-50 px-2.5 pr-6 text-meta font-semibold text-neutral-700 outline-none transition-colors hover:border-neutral-300 hover:bg-neutral-100"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="text-label font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                >
                  {tp('dashboard')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg border border-neutral-200 px-4 py-1.5 text-label font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  {tp('signOut')}
                </button>
              </div>
            ) : (
              <Link
                to="/signin"
                className="rounded-lg bg-ink px-5 py-2 text-label font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {tp('signIn')}
              </Link>
            )}
          </nav>

          {/* Mobile menu button — text-only, no icon */}
          <button
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-label font-semibold text-neutral-700 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={tp('toggleMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-neutral-200 bg-white lg:hidden" aria-label="Mobile navigation">
          <div className="section-container py-4">
            <div className="flex flex-col gap-1">
              <select
                value={lang}
                onChange={(event) => setLang(event.target.value as typeof lang)}
                aria-label={tp('languageLabel')}
                className="mb-2 h-11 w-full cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-body font-medium text-neutral-700 outline-none"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.fullLabel}</option>
                ))}
              </select>

              <Link
                to="/help"
                className="rounded-lg px-4 py-2.5 text-body font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                onClick={() => setMobileOpen(false)}
              >
                {tp('help')}
              </Link>
              <Link
                to="/parcels"
                className="rounded-lg px-4 py-2.5 text-body font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                onClick={() => setMobileOpen(false)}
              >
                {tp('trackParcel')}
              </Link>
              <Link
                to="/manage-booking"
                className="rounded-lg px-4 py-2.5 text-body font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                onClick={() => setMobileOpen(false)}
              >
                {tp('manageBooking')}
              </Link>

              <div className="my-2 h-px bg-neutral-100" />

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="rounded-lg px-4 py-2.5 text-body font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    {tp('dashboard')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="mt-1 w-full rounded-lg border border-neutral-200 py-2.5 text-body font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    {tp('signOut')}
                  </button>
                </>
              ) : (
                <Link
                  to="/signin"
                  className="mt-1 block w-full rounded-lg bg-ink py-2.5 text-center text-body font-semibold text-white transition-colors hover:bg-brand-700"
                  onClick={() => setMobileOpen(false)}
                >
                  {tp('signIn')}
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
