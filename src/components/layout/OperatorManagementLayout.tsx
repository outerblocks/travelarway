import { useState, type ReactNode } from 'react';
import { Link } from '@/router';
import {
  LayoutDashboard, CalendarDays, Users, BarChart3, Bus, Ship, Settings,
  ArrowLeft, LogOut, Route, ClipboardList, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n, type TranslationKey } from '@/context/I18nContext';

export type MgmtSection = 'overview' | 'routes' | 'schedules' | 'fleet' | 'manifest' | 'bookings' | 'analytics';

interface MgmtSidebarItem {
  id: MgmtSection;
  labelKey?: TranslationKey;
  /** Interior console copy is English only; passenger surfaces stay translated. */
  label?: string;
  icon: LucideIcon;
}

const SIDEBAR_ITEMS: MgmtSidebarItem[] = [
  { id: 'overview', labelKey: 'mgmtOverview', icon: LayoutDashboard },
  { id: 'routes', label: 'Routes & fares', icon: Route },
  { id: 'schedules', labelKey: 'scheduleManagement', icon: CalendarDays },
  { id: 'fleet', labelKey: 'fleetManagement', icon: Bus },
  { id: 'manifest', label: 'Manifest & OTC', icon: ClipboardList },
  { id: 'bookings', labelKey: 'bookingManagement', icon: Users },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart3 },
];

const SIDEBAR_ITEMS_FERRY: MgmtSidebarItem[] = [
  { id: 'overview', labelKey: 'mgmtOverview', icon: LayoutDashboard },
  { id: 'routes', label: 'Routes & fares', icon: Route },
  { id: 'schedules', labelKey: 'scheduleManagement', icon: CalendarDays },
  { id: 'fleet', labelKey: 'vesselManagement', icon: Ship },
  { id: 'manifest', label: 'Manifest & OTC', icon: ClipboardList },
  { id: 'bookings', labelKey: 'bookingManagement', icon: Users },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart3 },
];

export interface OperatorInfo {
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
}

export function OperatorManagementLayout({
  operator,
  mode,
  operators,
  selectedOperatorId,
  onSelectOperator,
  activeSection,
  onSectionChange,
  children,
}: {
  operator: OperatorInfo;
  mode: 'bus' | 'ferry';
  operators: OperatorInfo[];
  selectedOperatorId: string;
  onSelectOperator: (id: string) => void;
  activeSection: MgmtSection;
  onSectionChange: (s: MgmtSection) => void;
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const ModeIcon = mode === 'bus' ? Bus : Ship;
  const consoleTitle = mode === 'bus' ? t('busOperators') : t('ferryOperators');
  const items = mode === 'bus' ? SIDEBAR_ITEMS : SIDEBAR_ITEMS_FERRY;

  const handleNav = (s: MgmtSection) => {
    onSectionChange(s);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-ink text-white/70 fixed inset-y-0 left-0 z-30">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
              <ModeIcon size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{consoleTitle}</p>
              <p className="text-[11px] text-neutral-500">{t('mgmtConsole')}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-3 py-3">
          <p className="mb-1.5 px-3 text-[11px] font-medium text-white/50">{t('selectOperator')}</p>
          <select
            value={selectedOperatorId}
            onChange={(e) => onSelectOperator(e.target.value)}
            className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            {operators.map((op) => (
              <option key={op.operatorId} value={op.operatorId}>{op.operatorName}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-white text-ink'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{item.label ?? t(item.labelKey as TranslationKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <Link to="/" className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:text-white">
            <ArrowLeft size={16} />
            <span>{t('backToSite')}</span>
          </Link>
          <button onClick={() => signOut()} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white rounded-md transition-colors">
            <LogOut size={16} />
            <span>{t('signOut')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-neutral-900/60" onClick={() => setSidebarOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-neutral-900 text-neutral-300 overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
                  <ModeIcon size={20} className="text-white" />
                </div>
                <p className="text-sm font-bold text-white">{consoleTitle}</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-500 text-lg">✕</button>
            </div>
            <div className="px-3 py-3 border-b border-neutral-800">
              <select
                value={selectedOperatorId}
                onChange={(e) => onSelectOperator(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-800 text-white border border-neutral-700 rounded-md"
              >
                {operators.map((op) => (
                  <option key={op.operatorId} value={op.operatorId}>{op.operatorName}</option>
                ))}
              </select>
            </div>
            <nav className="px-3 py-3">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                      isActive ? 'bg-brand-600 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <Icon size={17} />
                    <span>{item.label ?? t(item.labelKey as TranslationKey)}</span>
                  </button>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-neutral-800 space-y-1">
              <Link to="/" className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-400 rounded-md">
                <ArrowLeft size={16} /> {t('backToSite')}
              </Link>
              <button onClick={() => signOut()} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-neutral-400 rounded-md">
                <LogOut size={16} /> {t('signOut')}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 lg:ml-60 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-md"
              onClick={() => setSidebarOpen(true)}
            >
              <Settings size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-neutral-900">{operator.operatorName}</h1>
              <p className="text-[11px] text-neutral-500">{consoleTitle} - {t('mgmtConsole')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedOperatorId}
              onChange={(e) => onSelectOperator(e.target.value)}
              className="lg:hidden px-3 py-1.5 text-sm border border-neutral-300 rounded-md bg-white text-neutral-700"
            >
              {operators.map((op) => (
                <option key={op.operatorId} value={op.operatorId}>{op.operatorName}</option>
              ))}
            </select>
            <div className="w-8 h-8 bg-brand-600 rounded-md flex items-center justify-center text-white text-sm font-bold">
              {operator.operatorLogo}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
}
