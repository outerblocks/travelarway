import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, HelpCircle, User, Ticket, LogOut, LayoutDashboard, Languages, Bus, Ship } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lang, setLang } = useI18n();

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0" aria-label="Travelar home">
            <Logo size="md" />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
              className="btn-ghost text-label"
              aria-label="Toggle language"
            >
              <Languages size={16} />
              {lang === 'en' ? 'SW' : 'EN'}
            </button>
            <Link to="/help" className="btn-ghost text-label">
              <HelpCircle size={16} />
              Help
            </Link>
            <Link to="/manage-booking" className="btn-ghost text-label">
              <Ticket size={16} />
              Manage Booking
            </Link>
            {user ? (
              <div className="flex items-center gap-1">
                <Link to="/dashboard" className="btn-ghost text-label">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link to="/operator/bus" className="btn-ghost text-label">
                  <Bus size={16} />
                  Bus Console
                </Link>
                <Link to="/operator/ferry" className="btn-ghost text-label">
                  <Ship size={16} />
                  Ferry Console
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary text-label px-4 py-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/signin" className="btn-secondary text-label px-4 py-2">
                <User size={16} />
                Sign In
              </Link>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-neutral-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white animate-fade-in">
          <div className="section-container py-4">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
                className="btn-ghost justify-start"
              >
                <Languages size={18} />
                {lang === 'en' ? 'Kiswahili' : 'English'}
              </button>
              <Link to="/help" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                <HelpCircle size={18} />
                Help
              </Link>
              <Link to="/manage-booking" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                <Ticket size={18} />
                Manage Booking
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                    <LayoutDashboard size={18} />
                    Dashboard
                  </Link>
                  <Link to="/operator/bus" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                    <Bus size={18} />
                    Bus Management
                  </Link>
                  <Link to="/operator/ferry" className="btn-ghost justify-start" onClick={() => setMobileOpen(false)}>
                    <Ship size={18} />
                    Ferry Management
                  </Link>
                  <button onClick={handleSignOut} className="btn-secondary justify-start">
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/signin" className="btn-secondary" onClick={() => setMobileOpen(false)}>
                  <User size={18} />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
