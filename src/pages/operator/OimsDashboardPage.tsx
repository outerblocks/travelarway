import { useMemo, useState } from 'react';
import { Navigate } from '@/router';
import {
  BarChart3, CalendarDays, CheckCircle2, Clock, DollarSign, LayoutDashboard,
  MapPin, Ticket, Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { TranslationKey } from '@/context/I18nContext';
import { RoutePending } from '@/components/shared/RouteStates';
import { OperatorManagementLayout, type MgmtSection, type OperatorInfo } from '@/components/layout/OperatorManagementLayout';
import {
  FleetSection, ManifestSection, RoutesSection, SchedulesSection, VesselsSection,
} from '@/pages/operator/OimsSections';
import { useOperations } from '@/hooks/useOperations';
import type { OpsMode } from '@/data/operations';

const nf = (value: number, currency: string) =>
  currency === 'TZS' ? `TSh ${Math.round(value).toLocaleString()}` : `$${Math.round(value).toLocaleString()}`;

/**
 * OIMS: the operator's own console. Bus and ferry operators share the shell; the
 * route decides which configuration surfaces (vehicles + seat maps, or vessels +
 * classes) and which departures are shown.
 */
export function OimsDashboardPage({ mode }: { mode: OpsMode }) {
  const { user, loading } = useAuth();
  const ops = useOperations();
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<MgmtSection>('overview');

  const operators = ops.operators.filter((operator) => operator.mode === mode);
  const operator = operators.find((candidate) => candidate.id === selectedOperatorId) ?? operators[0];

  const operatorInfo: OperatorInfo | null = operator
    ? { operatorId: operator.id, operatorName: operator.name, operatorLogo: operator.logo }
    : null;
  const allOperatorInfos: OperatorInfo[] = operators.map((candidate) => ({
    operatorId: candidate.id,
    operatorName: candidate.name,
    operatorLogo: candidate.logo,
  }));

  const scheduleIds = useMemo(
    () => new Set(ops.schedules.filter((schedule) => schedule.operatorId === operator?.id).map((schedule) => schedule.id)),
    [ops.schedules, operator?.id],
  );
  const bookings = useMemo(
    () => ops.bookings.filter((booking) => booking.operatorId === operator?.id),
    [ops.bookings, operator?.id],
  );
  const schedules = ops.schedules.filter((schedule) => schedule.operatorId === operator?.id);
  const activeSchedules = schedules.filter((schedule) => schedule.status === 'scheduled' || schedule.status === 'boarding');
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
  const seatsSold = confirmed.reduce((sum, booking) => sum + booking.passengers, 0);
  const otcSales = bookings.filter((booking) => booking.channel === 'otc');
  const currency = mode === 'bus' ? 'TZS' : 'USD';
  const revenue = confirmed
    .filter((booking) => booking.currency === currency)
    .reduce((sum, booking) => sum + booking.amount, 0);

  // One frame while the browser session is adopted, then the console or sign-in.
  if (loading) return <RoutePending />;
  if (!user) return <Navigate to="/operator/oims-signin" replace />;
  if (!operator || !operatorInfo) {
    return <div className="p-12 text-center text-sm text-neutral-500">No operators are provisioned for this mode yet.</div>;
  }

  const recent = [...bookings]
    .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
    .slice(0, 6);

  const revenueByDay = Object.entries(
    confirmed.reduce<Record<string, number>>((acc, booking) => {
      const day = booking.bookedAt.slice(0, 10);
      acc[day] = (acc[day] ?? 0) + (booking.currency === currency ? booking.amount : 0);
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b)).slice(-7);
  const peak = Math.max(1, ...revenueByDay.map(([, amount]) => amount));

  return (
    <OperatorManagementLayout
      operator={operatorInfo}
      mode={mode}
      operators={allOperatorInfos}
      selectedOperatorId={operator.id}
      onSelectOperator={setSelectedOperatorId}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi icon={CalendarDays} label="Live departures" value={String(activeSchedules.length)} />
            <Kpi icon={Users} label="Bookings" value={String(bookings.length)} />
            <Kpi icon={Ticket} label="Seats sold" value={String(seatsSold)} />
            <Kpi icon={DollarSign} label="Confirmed revenue" value={nf(revenue, currency)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Next departures" subtitle={`${schedules.length} published`}>
              <div className="divide-y divide-neutral-100">
                {activeSchedules.slice(0, 5).map((schedule) => {
                  const route = ops.routes.find((candidate) => candidate.id === schedule.routeId);
                  const pax = ops.bookings
                    .filter((booking) => booking.scheduleId === schedule.id && booking.status === 'confirmed')
                    .reduce((sum, booking) => sum + booking.passengers, 0);
                  return (
                    <div key={schedule.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">{route?.name ?? '—'}</p>
                        <p className="text-xs text-neutral-500">{schedule.departureDate} · {schedule.departureTime} → {schedule.arrivalTime}</p>
                      </div>
                      <span className="text-xs font-semibold text-neutral-600">{pax} pax</span>
                    </div>
                  );
                })}
                {activeSchedules.length === 0 && <Empty>No departures published yet.</Empty>}
              </div>
            </Panel>

            <Panel title="Recent bookings" subtitle={`${otcSales.length} counter sales`}>
              <div className="divide-y divide-neutral-100">
                {recent.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-neutral-900">{booking.customerName}</span>
                      <span className="block truncate text-xs text-neutral-500">{booking.routeLabel} · {booking.seats.join(', ')}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      booking.channel === 'otc' ? 'bg-warning-50 text-warning-700' : 'bg-brand-50 text-brand-700'
                    }`}>
                      {booking.channel === 'otc' ? 'OTC' : 'Online'}
                    </span>
                  </div>
                ))}
                {recent.length === 0 && <Empty>No bookings yet.</Empty>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {activeSection === 'routes' && <RoutesSection operatorId={operator.id} mode={mode} />}
      {activeSection === 'schedules' && <SchedulesSection operatorId={operator.id} mode={mode} />}
      {activeSection === 'fleet' && (mode === 'bus'
        ? <FleetSection operatorId={operator.id} />
        : <VesselsSection operatorId={operator.id} />)}
      {activeSection === 'manifest' && <ManifestSection operatorId={operator.id} mode={mode} />}

      {activeSection === 'bookings' && (
        <BookingList
          bookings={bookings}
          currency={currency}
          scheduleIds={scheduleIds}
        />
      )}

      {activeSection === 'analytics' && (
        <div className="space-y-6">
          <Panel title="Revenue, last 7 selling days" subtitle={nf(revenue, currency)}>
            <div className="flex items-end gap-3 px-4 pb-4">
              {revenueByDay.map(([day, amount]) => (
                <div key={day} className="flex-1 text-center">
                  <div
                    className="mx-auto w-full rounded-t bg-brand-600"
                    style={{ height: `${Math.max(6, (amount / peak) * 120)}px` }}
                    title={`${day}: ${nf(amount, currency)}`}
                  />
                  <p className="mt-1 text-[10px] text-neutral-500">{day.slice(5)}</p>
                </div>
              ))}
              {revenueByDay.length === 0 && <Empty>No sales recorded yet.</Empty>}
            </div>
          </Panel>
          <Panel title="Channel mix" subtitle={`${bookings.length} bookings`}>
            <div className="grid grid-cols-2 gap-4 p-4">
              <ChannelStat label="Online" value={bookings.length - otcSales.length} total={bookings.length} icon={MapPin} />
              <ChannelStat label="Counter (OTC)" value={otcSales.length} total={bookings.length} icon={Ticket} />
            </div>
          </Panel>
        </div>
      )}
    </OperatorManagementLayout>
  );
}

function BookingList({ bookings, currency, scheduleIds }: {
  bookings: ReturnType<typeof useOperations>['bookings'];
  currency: string;
  scheduleIds: Set<string>;
}) {
  const [status, setStatus] = useState<'all' | 'confirmed' | 'pending' | 'cancelled' | 'refunded'>('all');
  const [channel, setChannel] = useState<'all' | 'online' | 'otc'>('all');

  const rows = bookings
    .filter((booking) => scheduleIds.has(booking.scheduleId))
    .filter((booking) => (status === 'all' ? true : booking.status === status))
    .filter((booking) => (channel === 'all' ? true : booking.channel === channel));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Users} label="All bookings" value={String(bookings.length)} />
        <Kpi icon={CheckCircle2} label="Confirmed" value={String(bookings.filter((b) => b.status === 'confirmed').length)} />
        <Kpi icon={Clock} label="Pending" value={String(bookings.filter((b) => b.status === 'pending').length)} />
        <Kpi icon={Ticket} label="OTC" value={String(bookings.filter((b) => b.channel === 'otc').length)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-3">
          <h2 className="text-sm font-bold text-neutral-900">Bookings</h2>
          <select
            className="ml-auto rounded-md border border-neutral-200 px-2 py-1 text-xs"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            {['all', 'confirmed', 'pending', 'cancelled', 'refunded'].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
            value={channel}
            onChange={(event) => setChannel(event.target.value as typeof channel)}
          >
            {['all', 'online', 'otc'].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-2">Reference</th>
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Seats</th>
                <th className="px-4 py-2">Channel</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-neutral-600">{booking.reference}</td>
                  <td className="px-4 py-2 text-neutral-700">{booking.routeLabel}</td>
                  <td className="px-4 py-2 text-neutral-700">{booking.customerName}</td>
                  <td className="px-4 py-2 text-neutral-600">{booking.seats.join(', ') || '—'}</td>
                  <td className="px-4 py-2 text-neutral-600">{booking.channel === 'otc' ? 'OTC' : 'Online'}</td>
                  <td className="px-4 py-2 text-neutral-700">{nf(booking.amount, booking.currency === currency ? currency : booking.currency)}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-500">No bookings match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon size={15} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
        {subtitle && <span className="text-xs text-neutral-400">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-neutral-500">{children}</p>;
}

function ChannelStat({ label, value, total, icon: Icon }: {
  label: string;
  value: number;
  total: number;
  icon: typeof LayoutDashboard;
}) {
  const share = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value} <span className="text-xs font-medium text-neutral-500">({share}%)</span></p>
    </div>
  );
}

export type { TranslationKey };
