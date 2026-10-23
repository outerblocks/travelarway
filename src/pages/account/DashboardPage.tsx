import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  LogOut, Calendar, Wallet, Clock, ArrowRight, XCircle, CheckCircle2,
  Ticket, MapPin, LayoutDashboard, Compass,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n, type TranslationKey } from '@/context/I18nContext';
import { MODE_ICON_MAP } from '@/components/ui/ModeIcons';
import { TRIP_HISTORY, type TripRecord, type TripStatus } from '@/data/tripHistory';
import type { BookingMode } from '@/types';

type SidebarSection = 'overview' | 'profile' | 'settings' | 'all' | BookingMode;

interface SidebarItem {
  id: SidebarSection;
  labelKey: TranslationKey;
  icon: LucideIcon;
}

const SIDEBAR_SECTIONS: { heading?: TranslationKey; items: SidebarItem[] }[] = [
  {
    items: [
      { id: 'overview', labelKey: 'overview', icon: LayoutDashboard },
      { id: 'all', labelKey: 'allBookings', icon: Ticket },
      { id: 'profile', labelKey: 'profile', icon: Compass },
    ],
  },
  {
    heading: 'bookings',
    items: [
      { id: 'bus', labelKey: 'busBookings', icon: MODE_ICON_MAP.bus },
      { id: 'ferry', labelKey: 'ferryBookings', icon: MODE_ICON_MAP.ferry },
      { id: 'flights', labelKey: 'flightBookings', icon: MODE_ICON_MAP.flights },
      { id: 'train', labelKey: 'trainBookings', icon: MODE_ICON_MAP.train },
      { id: 'stays', labelKey: 'stayBookings', icon: MODE_ICON_MAP.stays },
      { id: 'experiences', labelKey: 'experienceBookings', icon: MODE_ICON_MAP.experiences },
    ],
  },
  {
    items: [
      { id: 'settings', labelKey: 'settings', icon: MapPin },
    ],
  },
];

const STATUS_META: Record<TripStatus, { labelKey: TranslationKey; class: string; icon: LucideIcon }> = {
  upcoming: { labelKey: 'upcoming', class: 'bg-brand-50 text-brand-700', icon: Clock },
  completed: { labelKey: 'completed', class: 'bg-accent-50 text-accent-700', icon: CheckCircle2 },
  cancelled: { labelKey: 'cancelled', class: 'bg-error-50 text-error-600', icon: XCircle },
};

const STATUS_TABS: (TripStatus | 'all')[] = ['all', 'upcoming', 'completed', 'cancelled'];

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'TZS') return `TSh ${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function formatDate(iso: string, lang: 'en' | 'sw'): string {
  return new Date(iso).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { t, lang } = useI18n();
  const [activeSection, setActiveSection] = useState<SidebarSection>('overview');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const getTripsForSection = (section: SidebarSection): TripRecord[] => {
    if (section === 'all' || section === 'overview') return TRIP_HISTORY;
    if (section === 'profile' || section === 'settings') return [];
    return TRIP_HISTORY.filter((trip) => trip.mode === section);
  };

  const sectionTrips = getTripsForSection(activeSection);
  const filteredTrips = statusFilter === 'all'
    ? sectionTrips
    : sectionTrips.filter((trip) => trip.status === statusFilter);

  const upcoming = TRIP_HISTORY.filter((trip) => trip.status === 'upcoming');
  const completed = TRIP_HISTORY.filter((trip) => trip.status === 'completed');
  const totalSpent = TRIP_HISTORY
    .filter((trip) => trip.status !== 'cancelled')
    .reduce((sum, trip) => sum + trip.amount, 0);
  const modesUsed = new Set(TRIP_HISTORY.filter((trip) => trip.status !== 'cancelled').map((trip) => trip.mode));

  const handleNavClick = (section: SidebarSection) => {
    setActiveSection(section);
    setStatusFilter('all');
    setSidebarOpen(false);
  };

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="section-container py-0">
        <div className="flex gap-0">
          {/* Sidebar - desktop */}
          <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-neutral-200 min-h-[calc(100vh-4rem)] py-8 pr-4">
            <SidebarNav activeSection={activeSection} onNavigate={handleNavClick} t={t} />
            <div className="mt-auto pt-6">
              <button onClick={() => signOut()} className="btn-ghost justify-start w-full text-label text-neutral-500">
                <LogOut size={16} /> {t('signOut')}
              </button>
            </div>
          </aside>

          {/* Sidebar - mobile drawer */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-neutral-900/40" onClick={() => setSidebarOpen(false)}>
              <aside
                className="absolute left-0 top-0 bottom-0 w-72 bg-white py-6 px-4 overflow-y-auto animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-listing font-bold text-neutral-900">{t('dashboard')}</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 text-neutral-400">
                    <XCircle size={20} />
                  </button>
                </div>
                <SidebarNav activeSection={activeSection} onNavigate={handleNavClick} t={t} />
                <div className="mt-auto pt-6">
                  <button onClick={() => signOut()} className="btn-ghost justify-start w-full text-label text-neutral-500">
                    <LogOut size={16} /> {t('signOut')}
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0 py-8 lg:pl-8">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden btn-secondary mb-4"
              onClick={() => setSidebarOpen(true)}
            >
              <LayoutDashboard size={16} /> {t('dashboard')}
            </button>

            {activeSection === 'overview' && (
              <OverviewContent
                user={user}
                t={t}
                lang={lang}
                upcoming={upcoming}
                completed={completed}
                totalSpent={totalSpent}
                modesUsed={modesUsed}
                onNavigate={handleNavClick}
              />
            )}

            {activeSection === 'profile' && <ProfileContent user={user} t={t} />}
            {activeSection === 'settings' && <SettingsContent t={t} />}

            {activeSection !== 'overview' && activeSection !== 'profile' && activeSection !== 'settings' && (
              <BookingsContent
                t={t}
                lang={lang}
                title={getSectionTitle(activeSection, t)}
                trips={filteredTrips}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getSectionTitle(section: SidebarSection, t: (key: TranslationKey) => string): string {
  const titleMap: Record<string, TranslationKey> = {
    all: 'allBookings',
    bus: 'busBookings',
    ferry: 'ferryBookings',
    flights: 'flightBookings',
    train: 'trainBookings',
    stays: 'stayBookings',
    experiences: 'experienceBookings',
  };
  return t(titleMap[section] ?? 'allBookings');
}

function SidebarNav({ activeSection, onNavigate, t }: {
  activeSection: SidebarSection;
  onNavigate: (s: SidebarSection) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {SIDEBAR_SECTIONS.map((group, gi) => (
        <div key={gi} className="mb-2">
          {group.heading && (
            <p className="text-meta text-neutral-400 font-medium uppercase tracking-wide px-3 mb-1.5">
              {t(group.heading)}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-label font-medium rounded-sm transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{t(item.labelKey)}</span>
                {item.id !== 'overview' && item.id !== 'profile' && item.id !== 'settings' && (
                  <TripCountBadge section={item.id} />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function TripCountBadge({ section }: { section: SidebarSection }) {
  const count = section === 'all'
    ? TRIP_HISTORY.length
    : TRIP_HISTORY.filter((trip) => trip.mode === section).length;
  if (count === 0) return null;
  return <span className="text-meta text-neutral-400 font-normal">{count}</span>;
}

function OverviewContent({ user, t, lang, upcoming, completed, totalSpent, modesUsed, onNavigate }: {
  user: { name: string; email: string; provider: string };
  t: (key: TranslationKey) => string;
  lang: 'en' | 'sw';
  upcoming: TripRecord[];
  completed: TripRecord[];
  totalSpent: number;
  modesUsed: Set<BookingMode>;
  onNavigate: (s: SidebarSection) => void;
}) {
  const recentTrips = [...TRIP_HISTORY]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page font-bold text-neutral-900">{t('dashboard')}</h1>
        <p className="text-body text-neutral-500 mt-1">
          {t('welcomeBack')}, <span className="font-medium text-neutral-700">{user.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label={t('upcomingTrips')} value={String(upcoming.length)} accent="brand" />
        <StatCard icon={CheckCircle2} label={t('completedTrips')} value={String(completed.length)} accent="accent" />
        <StatCard icon={Wallet} label={t('totalSpent')} value={formatCurrency(totalSpent, 'USD')} accent="neutral" />
        <StatCard icon={Compass} label={t('travelModes')} value={String(modesUsed.size)} accent="brand" />
      </div>

      {upcoming.length > 0 && (
        <div className="card p-6">
          <h2 className="text-listing font-bold text-neutral-900 mb-4">{t('nextTrip')}</h2>
          <NextTripCard trip={upcoming[0]} t={t} lang={lang} />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-6 pb-0 flex items-center justify-between">
          <h2 className="text-listing font-bold text-neutral-900">{t('recentBookings')}</h2>
          <button
            onClick={() => onNavigate('all')}
            className="text-label font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            {t('viewAll')} <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-neutral-100 mt-4">
          {recentTrips.map((trip) => (
            <TripRow key={trip.id} trip={trip} t={t} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileContent({ user, t }: {
  user: { name: string; email: string; provider: string };
  t: (key: TranslationKey) => string;
}) {
  const providerLabel = user.provider === 'email' ? t('emailPassword') : user.provider === 'google' ? t('google') : t('apple');

  return (
    <div className="space-y-6">
      <h1 className="text-page font-bold text-neutral-900">{t('profile')}</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-listing font-bold text-neutral-900">{user.name}</h2>
            <p className="text-body text-neutral-500">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
          <ProfileRow label={t('name')} value={user.name} />
          <ProfileRow label={t('email')} value={user.email} />
          <ProfileRow label={t('signInMethod')} value={providerLabel} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-listing font-bold text-neutral-900 mb-4">{t('quickActions')}</h2>
        <div className="flex flex-col gap-2">
          <Link to="/manage-booking" className="btn-ghost justify-start text-label">
            <Ticket size={16} /> {t('manageBooking')}
          </Link>
          <Link to="/" className="btn-ghost justify-start text-label">
            <MapPin size={16} /> {t('searchNewTrips')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function SettingsContent({ t }: { t: (key: TranslationKey) => string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className="space-y-6">
      <h1 className="text-page font-bold text-neutral-900">{t('settings')}</h1>
      <div className="card p-6">
        <h2 className="text-listing font-bold text-neutral-900 mb-4">{t('language')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-2.5 text-body font-medium rounded-sm border transition-colors ${
              lang === 'en'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {t('english')}
          </button>
          <button
            onClick={() => setLang('sw')}
            className={`px-4 py-2.5 text-body font-medium rounded-sm border transition-colors ${
              lang === 'sw'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {t('swahili')}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingsContent({ t, lang, title, trips, statusFilter, onStatusChange }: {
  t: (key: TranslationKey) => string;
  lang: 'en' | 'sw';
  title: string;
  trips: TripRecord[];
  statusFilter: TripStatus | 'all';
  onStatusChange: (s: TripStatus | 'all') => void;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-page font-bold text-neutral-900">{title}</h1>
      <div className="card overflow-hidden">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-listing font-bold text-neutral-900">{t('tripHistory')}</h2>
            <span className="text-meta text-neutral-400">
              {trips.length} {trips.length === 1 ? t('trip') : t('trips')}
            </span>
          </div>
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => onStatusChange(tab)}
                className={`px-3 py-1.5 text-label font-medium rounded-sm whitespace-nowrap transition-colors ${
                  statusFilter === tab
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {tab === 'all' ? t('all') : t(STATUS_META[tab].labelKey)}
              </button>
            ))}
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-body text-neutral-400">{t('noTripsCategory')}</p>
            <Link to="/" className="btn-secondary mt-4 inline-flex">
              {t('bookNextTrip')} <ArrowRight size={16} />
            </Link>
          </div>
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

function StatCard({ icon: Icon, label, value }: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: 'brand' | 'accent' | 'neutral';
}) {
  return (
    <div className="card p-4 lg:p-5">
      <div className="w-14 h-14 bg-brand-600 rounded-lg flex items-center justify-center mb-3">
        <Icon size={28} className="text-white" />
      </div>
      <p className="text-meta text-neutral-500 mb-1">{label}</p>
      <p className="text-listing font-bold text-neutral-900 truncate">{value}</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-meta text-neutral-500">{label}</span>
      <span className="text-body font-medium text-neutral-800 truncate">{value}</span>
    </div>
  );
}

function NextTripCard({ trip, t, lang }: { trip: TripRecord; t: (key: TranslationKey) => string; lang: 'en' | 'sw' }) {
  const Icon = MODE_ICON_MAP[trip.mode];
  const daysUntil = Math.ceil((new Date(trip.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex items-start gap-3">
      <div className="w-14 h-14 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={28} className="text-white" />
      </div>
      <div className="min-w-0">
        <h3 className="text-body font-bold text-neutral-900 leading-snug">{trip.title}</h3>
        <p className="text-label text-neutral-500 mt-0.5">{formatDate(trip.date, lang)}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-meta font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-sm">
            {daysUntil > 0
              ? `${daysUntil} ${daysUntil === 1 ? t('dayAway') : t('daysAway')}`
              : t('today')}
          </span>
          <span className="text-meta text-neutral-400">{t('ref')}: {trip.reference}</span>
        </div>
      </div>
    </div>
  );
}

function TripRow({ trip, t, lang }: { trip: TripRecord; t: (key: TranslationKey) => string; lang: 'en' | 'sw' }) {
  const Icon = MODE_ICON_MAP[trip.mode];
  const status = STATUS_META[trip.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-5 hover:bg-neutral-50 transition-colors">
      <div className="w-14 h-14 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
        <Icon size={28} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-body font-bold text-neutral-900 truncate">{trip.title}</h3>
        <p className="text-label text-neutral-500 truncate">{trip.route}</p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-meta text-neutral-500 flex items-center gap-1">
            <Calendar size={12} /> {formatDate(trip.date, lang)}
          </span>
          <span className="text-meta text-neutral-500">
            {trip.passengers} {trip.passengers === 1 ? t('passenger') : t('passengers')}
          </span>
          <span className="text-meta text-neutral-400">{t('ref')}: {trip.reference}</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-body font-bold text-neutral-900">{formatCurrency(trip.amount, trip.currency)}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-meta font-medium ${status.class}`}>
          <StatusIcon size={12} /> {t(status.labelKey)}
        </span>
      </div>
    </div>
  );
}
