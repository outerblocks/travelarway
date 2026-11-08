import { useState } from 'react';
import { Link, Navigate } from '@/router';
import { Clock, XCircle, CheckCircle2, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { useI18n, type Language, type TranslationKey } from '@/context/I18nContext';
import { MODE_ICON_MAP } from '@/components/ui/ModeIcons';
import { TRIP_HISTORY, type TripRecord, type TripStatus } from '@/data/tripHistory';
import type { BookingMode } from '@/types';

/* ─── Sidebar types ─── */
type DashboardView = 'overview' | 'bookings' | 'profile' | 'settings' | 'saved' | 'payment-methods' | 'promo-codes';
type BookingFilter = 'all' | BookingMode;

interface SidebarLink {
  id: DashboardView;
  labelKey: TranslationKey;
}

const MAIN_NAV: SidebarLink[] = [
  { id: 'overview', labelKey: 'overview' },
  { id: 'bookings', labelKey: 'allBookings' },
];

const BOOKING_CATEGORIES: { id: BookingFilter; labelKey: TranslationKey; icon?: LucideIcon }[] = [
  { id: 'all', labelKey: 'allBookings' },
  { id: 'bus', labelKey: 'busBookings', icon: MODE_ICON_MAP.bus },
  { id: 'ferry', labelKey: 'ferryBookings', icon: MODE_ICON_MAP.ferry },
  { id: 'flights', labelKey: 'flightBookings', icon: MODE_ICON_MAP.flights },
  { id: 'train', labelKey: 'trainBookings', icon: MODE_ICON_MAP.train },
  { id: 'stays', labelKey: 'stayBookings', icon: MODE_ICON_MAP.stays },
  { id: 'experiences', labelKey: 'experienceBookings', icon: MODE_ICON_MAP.experiences },
];

const ACCOUNT_NAV: SidebarLink[] = [
  { id: 'saved', labelKey: 'savedTrips' },
  { id: 'payment-methods', labelKey: 'paymentMethods' },
  { id: 'promo-codes', labelKey: 'promoCodes' },
  { id: 'profile', labelKey: 'profile' },
  { id: 'settings', labelKey: 'settings' },
];

const STATUS_META: Record<TripStatus, { labelKey: TranslationKey; class: string; icon: LucideIcon }> = {
  upcoming: { labelKey: 'upcoming', class: 'bg-brand-50 text-brand-700', icon: Clock },
  completed: { labelKey: 'completed', class: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  cancelled: { labelKey: 'cancelled', class: 'bg-error-50 text-error-600', icon: XCircle },
};

const STATUS_TABS: (TripStatus | 'all')[] = ['all', 'upcoming', 'completed', 'cancelled'];

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'TZS') return `TSh ${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function formatDate(iso: string, lang: Language): string {
  return new Date(iso).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : lang === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ─── Main Dashboard ─── */
export function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const { bookingState, resetBooking } = useApp();
  const { t, lang } = useI18n();
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingsExpanded, setBookingsExpanded] = useState(true);

  if (loading) {
    return <div className="p-12 text-center" role="status">{t('loadingAccount')}</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const handleNavClick = (view: DashboardView) => {
    setActiveView(view);
    if (view !== 'bookings') setBookingFilter('all');
    setStatusFilter('all');
    setSidebarOpen(false);
  };

  const handleBookingCategory = (filter: BookingFilter) => {
    setActiveView('bookings');
    setBookingFilter(filter);
    setStatusFilter('all');
    setSidebarOpen(false);
  };

  // Filtered trips
  const allTrips = bookingFilter === 'all'
    ? TRIP_HISTORY
    : TRIP_HISTORY.filter((trip) => trip.mode === bookingFilter);
  const filteredTrips = statusFilter === 'all'
    ? allTrips
    : allTrips.filter((trip) => trip.status === statusFilter);

  // Stats
  const upcoming = TRIP_HISTORY.filter((trip) => trip.status === 'upcoming');
  const completed = TRIP_HISTORY.filter((trip) => trip.status === 'completed');
  const totalSpent = TRIP_HISTORY
    .filter((trip) => trip.status !== 'cancelled')
    .reduce((sum, trip) => sum + trip.amount, 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <div className="bg-white border-b border-neutral-200">
        <div className="section-container">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-md"
                onClick={() => setSidebarOpen(true)}
                aria-label={t('overview')}
              >
                <span aria-hidden="true" className="block text-lg leading-none">☰</span>
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-ink rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-neutral-900 leading-tight">{user.name}</p>
                  <p className="text-[11px] text-neutral-500">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/" className="btn-ghost text-label hidden sm:flex">
                {t('searchNewTrips') || 'Book a Trip'}
              </Link>
              <button
                onClick={() => {
                  // Clear the in-flight booking with the session so passenger details
                  // do not linger on a shared device.
                  resetBooking(bookingState.mode);
                  void signOut();
                }}
                className="btn-ghost text-label text-neutral-500"
              >
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="section-container py-0">
        <div className="flex gap-0">
          {/* ─── Desktop Sidebar ─── */}
          <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-neutral-200 min-h-[calc(100vh-4rem)] py-6 pr-5">
            <nav className="flex flex-col gap-0.5">
              {/* Main nav */}
              {MAIN_NAV.map((item) => {
                const isActive = activeView === item.id && (item.id !== 'bookings');
                return (
                  <button
                    key={item.id}
                    onClick={() => item.id === 'bookings' ? setBookingsExpanded(!bookingsExpanded) : handleNavClick(item.id)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-ink text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="flex-1 text-left">{t(item.labelKey)}</span>
                    {item.id === 'bookings' && (
                      <span aria-hidden="true" className={`inline-block leading-none transition-transform ${bookingsExpanded ? 'rotate-90' : ''}`}>›</span>
                    )}
                  </button>
                );
              })}

              {/* Booking sub-categories */}
              {bookingsExpanded && (
                <div className="ml-4 pl-3 border-l border-neutral-200 mt-1 mb-2 space-y-0.5">
                  {BOOKING_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeView === 'bookings' && bookingFilter === cat.id;
                    const count = cat.id === 'all'
                      ? TRIP_HISTORY.length
                      : TRIP_HISTORY.filter((t) => t.mode === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleBookingCategory(cat.id)}
                        className={`flex items-center gap-2 w-full px-2.5 py-2 text-[13px] font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-brand-50 text-brand-700'
                            : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {Icon ? <Icon size={15} /> : <span className="w-[15px]" />}
                        <span className="flex-1 text-left">{t(cat.labelKey)}</span>
                        {count > 0 && <span className="text-[11px] text-neutral-400">{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-neutral-200 my-3" />

              {/* Account nav */}
              {ACCOUNT_NAV.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-ink text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="flex-1 text-left">{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ─── Mobile Sidebar Drawer ─── */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-neutral-900/40" onClick={() => setSidebarOpen(false)}>
              <aside
                className="absolute left-0 top-0 bottom-0 w-72 bg-white py-6 px-4 overflow-y-auto animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-ink rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
                      <p className="text-[11px] text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100" aria-label="Close">
                    <span aria-hidden="true" className="text-base leading-none">✕</span>
                  </button>
                </div>

                <nav className="flex flex-col gap-0.5">
                  <button onClick={() => handleNavClick('overview')} className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-lg ${activeView === 'overview' ? 'bg-ink text-white' : 'text-neutral-700'}`}>
                    {t('overview')}
                  </button>

                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide px-3 mt-4 mb-1.5">{t('bookings')}</p>
                  {BOOKING_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeView === 'bookings' && bookingFilter === cat.id;
                    return (
                      <button key={cat.id} onClick={() => handleBookingCategory(cat.id)} className={`flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-lg ${isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600'}`}>
                        {Icon ? <Icon size={16} /> : <span className="w-4" />} {t(cat.labelKey)}
                      </button>
                    );
                  })}

                  <div className="h-px bg-neutral-200 my-3" />
                  {ACCOUNT_NAV.map((item) => {
                    return (
                      <button key={item.id} onClick={() => handleNavClick(item.id)} className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-lg ${activeView === item.id ? 'bg-ink text-white' : 'text-neutral-700'}`}>
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                </nav>
              </aside>
            </div>
          )}

          {/* ─── Main Content ─── */}
          <div className="flex-1 min-w-0 py-6 lg:pl-6">
            {activeView === 'overview' && (
              <OverviewContent user={user} t={t} lang={lang} upcoming={upcoming} completed={completed} totalSpent={totalSpent} onNavigate={handleNavClick} onBookingCategory={handleBookingCategory} />
            )}
            {activeView === 'bookings' && (
              <BookingsContent t={t} lang={lang} trips={filteredTrips} allTrips={allTrips} statusFilter={statusFilter} onStatusChange={setStatusFilter} bookingFilter={bookingFilter} />
            )}
            {activeView === 'profile' && <ProfileContent user={user} t={t} />}
            {activeView === 'settings' && <SettingsContent t={t} />}
            {activeView === 'saved' && <PlaceholderSection title={t('savedTrips') || 'Saved Trips'} desc="Your saved trips and wishlisted destinations will appear here." />}
            {activeView === 'payment-methods' && <PlaceholderSection title={t('paymentMethods') || 'Payment Methods'} desc="Your saved payment methods and cards will appear here." />}
            {activeView === 'promo-codes' && <PlaceholderSection title={t('promoCodes') || 'Promo Codes'} desc="Your promo codes and discount coupons will appear here. Try TRAVELAR10 for 10% off!" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Overview ─── */
function OverviewContent({ user, t, lang, upcoming, completed, totalSpent, onNavigate, onBookingCategory }: {
  user: { name: string; email: string; provider: string };
  t: (key: TranslationKey) => string;
  lang: Language;
  upcoming: TripRecord[];
  completed: TripRecord[];
  totalSpent: number;
  onNavigate: (v: DashboardView) => void;
  onBookingCategory: (f: BookingFilter) => void;
}) {
  const recentTrips = [...TRIP_HISTORY]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? (t('goodMorning') || 'Good morning') : hour < 17 ? (t('goodAfternoon') || 'Good afternoon') : (t('goodEvening') || 'Good evening');

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-neutral-900">{greeting}, {user.name}</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{t('welcomeBack')}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('upcomingTrips')} value={String(upcoming.length)} color="bg-ink" />
        <StatCard label={t('completedTrips')} value={String(completed.length)} color="bg-success-600" />
        <StatCard label={t('totalSpent')} value={formatCurrency(totalSpent, 'USD')} color="bg-ink" />
        <StatCard label={t('travelModes')} value={String(new Set(TRIP_HISTORY.filter((t) => t.status !== 'cancelled').map((t) => t.mode)).size)} color="bg-neutral-700" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/" className="flex min-h-[56px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50">
          <span className="text-label font-medium text-neutral-800">{t('searchNewTrips') || 'Book a Trip'}</span>
        </Link>
        <Link to="/manage-booking" className="flex min-h-[56px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50">
          <span className="text-label font-medium text-neutral-800">{t('manageBooking')}</span>
        </Link>
        <button onClick={() => onNavigate('saved')} className="flex min-h-[56px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50">
          <span className="text-label font-medium text-neutral-800">{t('savedTrips') || 'Saved'}</span>
        </button>
        <button onClick={() => onNavigate('promo-codes')} className="flex min-h-[56px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50">
          <span className="text-label font-medium text-neutral-800">{t('promoCodes') || 'Promo Codes'}</span>
        </button>
      </div>

      {/* Next upcoming trip */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-neutral-900">{t('nextTrip')}</h2>
            <button onClick={() => onBookingCategory('all')} className="text-[13px] font-medium text-ink hover:text-brand-700 flex items-center gap-0.5">
              {t('viewAll')} <span aria-hidden="true">→</span>
            </button>
          </div>
          <NextTripCard trip={upcoming[0]} t={t} lang={lang} />
        </div>
      )}

      {/* Recent bookings */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">{t('recentBookings')}</h2>
          <button
            onClick={() => onBookingCategory('all')}
            className="text-[13px] font-medium text-ink hover:text-brand-700 flex items-center gap-0.5"
          >
            {t('viewAll')} <span aria-hidden="true">→</span>
          </button>
        </div>
        {recentTrips.length === 0 ? (
          <EmptyBookings t={t} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentTrips.map((trip) => (
              <TripRow key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Bookings view ─── */
function BookingsContent({ t, lang, trips, allTrips, statusFilter, onStatusChange, bookingFilter }: {
  t: (key: TranslationKey) => string;
  lang: Language;
  trips: TripRecord[];
  allTrips: TripRecord[];
  statusFilter: TripStatus | 'all';
  onStatusChange: (s: TripStatus | 'all') => void;
  bookingFilter: BookingFilter;
}) {
  const titleMap: Record<string, TranslationKey> = {
    all: 'allBookings', bus: 'busBookings', ferry: 'ferryBookings',
    flights: 'flightBookings', train: 'trainBookings', stays: 'stayBookings',
    experiences: 'experienceBookings',
  };
  const title = t(titleMap[bookingFilter] ?? 'allBookings');

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {/* Status tabs */}
        <div className="px-5 py-3 border-b border-neutral-100 flex items-center gap-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab;
            const count = tab === 'all' ? allTrips.length : allTrips.filter((t) => t.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => onStatusChange(tab)}
                className={`px-3.5 py-1.5 text-[13px] font-medium rounded-full whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-ink text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab === 'all' ? t('all') : t(STATUS_META[tab].labelKey)}
                {count > 0 && <span className="ml-1 text-[11px] opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Trip list */}
        {trips.length === 0 ? (
          <EmptyBookings t={t} />
        ) : (
          <div className="divide-y divide-neutral-100">
            {trips.map((trip) => (
              <TripRow key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Profile ─── */
function ProfileContent({ user, t }: {
  user: { name: string; email: string; provider: string };
  t: (key: TranslationKey) => string;
}) {
  const providerLabel = user.provider === 'email' ? t('emailPassword') : user.provider === 'google' ? t('google') : t('apple');

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">{t('profile')}</h1>
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center text-white text-2xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">{user.name}</h2>
            <p className="text-sm text-neutral-500">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
          <ProfileRow label={t('name')} value={user.name} />
          <ProfileRow label={t('email')} value={user.email} />
          <ProfileRow label={t('signInMethod')} value={providerLabel} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-sm font-bold text-neutral-900 mb-4">{t('quickActions')}</h2>
        <div className="flex flex-col gap-2">
          <Link to="/manage-booking" className="btn-ghost justify-start text-label">
            {t('manageBooking')}
          </Link>
          <Link to="/" className="btn-ghost justify-start text-label">
            {t('searchNewTrips') || 'Search New Trips'}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Settings ─── */
function SettingsContent({ t }: { t: (key: TranslationKey) => string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">{t('settings')}</h1>
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-sm font-bold text-neutral-900 mb-4">{t('language')}</h2>
        <div className="flex gap-2">
          {([['en', 'english'], ['sw', 'swahili'], ['fr', 'french']] as const).map(([code, key]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                lang === code
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className={`h-1 w-8 ${color} rounded-full mb-3`} />
      <p className="text-meta text-neutral-500 mb-0.5">{label}</p>
      <p className="text-listing font-bold text-neutral-900 truncate">{value}</p>
    </div>
  );
}

function NextTripCard({ trip, t, lang }: { trip: TripRecord; t: (key: TranslationKey) => string; lang: Language }) {
  const Icon = MODE_ICON_MAP[trip.mode];
  const daysUntil = Math.ceil((new Date(trip.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-ink rounded-xl flex items-center justify-center shrink-0">
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-neutral-900 leading-snug">{trip.title}</h3>
        <p className="text-[13px] text-neutral-500 mt-0.5">{trip.route}</p>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-[12px] text-neutral-500 flex items-center gap-1">{formatDate(trip.date, lang)}</span>
          <span className="text-[12px] font-medium text-ink bg-brand-50 px-2 py-0.5 rounded-full">
            {daysUntil > 0
              ? `${daysUntil} ${daysUntil === 1 ? t('dayAway') : t('daysAway')}`
              : t('today')}
          </span>
          <span className="text-[12px] text-neutral-400">{t('ref')}: {trip.reference}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-neutral-900">{formatCurrency(trip.amount, trip.currency)}</p>
      </div>
    </div>
  );
}

function TripRow({ trip, t, lang }: { trip: TripRecord; t: (key: TranslationKey) => string; lang: Language }) {
  const Icon = MODE_ICON_MAP[trip.mode];
  const status = STATUS_META[trip.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-neutral-50 sm:items-center sm:gap-4 sm:px-5">
      <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center shrink-0 sm:w-11 sm:h-11">
        <Icon size={22} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-neutral-900 truncate">{trip.title}</h3>
        <p className="text-[13px] text-neutral-500 truncate">{trip.route}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-[12px] text-neutral-500 flex items-center gap-1">
            {formatDate(trip.date, lang)}
          </span>
          <span className="text-[12px] text-neutral-500">
            {trip.passengers} {trip.passengers === 1 ? t('passenger') : t('passengers')}
          </span>
          <span className="text-[12px] text-neutral-400">{t('ref')}: {trip.reference}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-bold text-neutral-900">{formatCurrency(trip.amount, trip.currency)}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${status.class}`}>
          <StatusIcon size={11} /> {t(status.labelKey)}
        </span>
      </div>
    </div>
  );
}

function EmptyBookings({ t }: { t: (key: TranslationKey) => string }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-medium text-neutral-600 mb-1">{t('noTripsCategory') || 'No bookings found'}</p>
      <p className="text-[13px] text-neutral-400 mb-4">Your bookings will appear here once you make a reservation.</p>
      <Link to="/" className="btn-primary inline-flex">
        {t('bookNextTrip') || 'Book Your First Trip'} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function PlaceholderSection({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <p className="text-sm text-neutral-500 max-w-sm mx-auto">{desc}</p>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-neutral-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium text-neutral-800 truncate mt-0.5">{value}</span>
    </div>
  );
}
