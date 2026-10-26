import { useMemo, useState } from 'react';
import { Navigate } from '@/router';
import { CheckCircle2, CircleSlash, DollarSign, Route as RouteIcon, Ticket, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { useOperations } from '@/hooks/useOperations';
import { setOperatorApproval, setBookingStatus, type OpsMode } from '@/data/operations';

const nf = (value: number, currency: string) =>
  currency === 'TZS' ? `TSh ${Math.round(value).toLocaleString()}` : `$${Math.round(value).toLocaleString()}`;

/**
 * HIMS: Travelar HQ console. It oversees every operator on the network and reads
 * the same operations store the operator consoles write to, so route, fleet,
 * schedule and manifest changes are visible here without a separate pipeline.
 */
export function HqDashboardPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const ops = useOperations();
  const [mode, setMode] = useState<'all' | OpsMode>('all');
  const [channel, setChannel] = useState<'all' | 'online' | 'otc'>('all');

  const operators = useMemo(
    () => ops.operators.filter((operator) => (mode === 'all' ? true : operator.mode === mode)),
    [ops.operators, mode],
  );

  const bookings = useMemo(
    () => ops.bookings
      .filter((booking) => (mode === 'all' ? true : booking.mode === mode))
      .filter((booking) => (channel === 'all' ? true : booking.channel === channel))
      .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()),
    [ops.bookings, mode, channel],
  );

  const confirmed = ops.bookings.filter((booking) => booking.status === 'confirmed');
  const seatsSold = confirmed.reduce((sum, booking) => sum + booking.passengers, 0);
  const otc = ops.bookings.filter((booking) => booking.channel === 'otc');

  const revenueByOperator = operators.map((operator) => {
    const totals = confirmed
      .filter((booking) => booking.operatorId === operator.id)
      .reduce<Record<string, number>>((acc, booking) => {
        acc[booking.currency] = (acc[booking.currency] ?? 0) + booking.amount;
        return acc;
      }, {});
    return { operator, totals };
  });

  if (loading) return <div className="p-12 text-center" role="status">{t('loadingAccount')}</div>;
  if (!user) return <Navigate to="/operator/hims-signin" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">HIMS · Travelar HQ</p>
            <h1 className="text-xl font-bold text-neutral-900">Network operations</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
              value={mode}
              onChange={(event) => setMode(event.target.value as typeof mode)}
            >
              {['all', 'bus', 'ferry'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm"
              value={channel}
              onChange={(event) => setChannel(event.target.value as typeof channel)}
            >
              {['all', 'online', 'otc'].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi icon={Users} label="Operators" value={`${ops.operators.filter((operator) => operator.hqApproved).length}/${ops.operators.length}`} />
          <Kpi icon={RouteIcon} label="Routes" value={String(ops.routes.length)} />
          <Kpi icon={Ticket} label="Seats sold" value={String(seatsSold)} />
          <Kpi icon={DollarSign} label="Counter sales" value={String(otc.length)} />
        </div>

        <Panel title="Operators" subtitle="Approve or suspend an operator's access to the network">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2">Operator</th>
                  <th className="px-4 py-2">Mode</th>
                  <th className="px-4 py-2">Routes</th>
                  <th className="px-4 py-2">Departures</th>
                  <th className="px-4 py-2">Bookings</th>
                  <th className="px-4 py-2">Revenue</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueByOperator.map(({ operator, totals }) => {
                  const operatorBookings = ops.bookings.filter((booking) => booking.operatorId === operator.id);
                  return (
                    <tr key={operator.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-[11px] font-bold text-white">
                            {operator.logo}
                          </span>
                          <span>
                            <span className="block font-semibold text-neutral-900">{operator.name}</span>
                            <span className="block text-xs text-neutral-500">{operator.contactEmail}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 capitalize text-neutral-600">{operator.mode}</td>
                      <td className="px-4 py-2 text-neutral-600">{ops.routes.filter((route) => route.operatorId === operator.id).length}</td>
                      <td className="px-4 py-2 text-neutral-600">{ops.schedules.filter((schedule) => schedule.operatorId === operator.id).length}</td>
                      <td className="px-4 py-2 text-neutral-600">{operatorBookings.length}</td>
                      <td className="px-4 py-2 text-neutral-700">
                        {Object.entries(totals).map(([currency, amount]) => (
                          <span key={currency} className="mr-2">{nf(amount, currency)}</span>
                        ))}
                        {Object.keys(totals).length === 0 && '—'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setOperatorApproval(operator.id, !operator.hqApproved)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            operator.hqApproved ? 'bg-accent-50 text-accent-700' : 'bg-error-50 text-error-600'
                          }`}
                        >
                          {operator.hqApproved ? <CheckCircle2 size={13} /> : <CircleSlash size={13} />}
                          {operator.hqApproved ? 'Approved' : 'Suspended'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Network routes" subtitle="Configured in OIMS by each operator">
          <div className="divide-y divide-neutral-100">
            {ops.routes
              .filter((route) => (mode === 'all' ? true : route.mode === mode))
              .map((route) => {
                const operator = ops.operators.find((candidate) => candidate.id === route.operatorId);
                return (
                  <div key={route.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{route.name}</p>
                      <p className="text-xs text-neutral-500">
                        {operator?.name ?? 'Unknown operator'} · {route.stops.length} stops · {route.segmentFares.length} fares
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-neutral-600">
                      {route.mode}
                    </span>
                  </div>
                );
              })}
          </div>
        </Panel>

        <Panel title="Booking oversight" subtitle={`${bookings.length} records`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Operator</th>
                  <th className="px-4 py-2">Route</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Channel</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 40).map((booking) => (
                  <tr key={booking.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-neutral-600">{booking.reference}</td>
                    <td className="px-4 py-2 text-neutral-700">
                      {ops.operators.find((operator) => operator.id === booking.operatorId)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{booking.routeLabel}</td>
                    <td className="px-4 py-2 text-neutral-600">{booking.customerName}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        booking.channel === 'otc' ? 'bg-warning-50 text-warning-700' : 'bg-brand-50 text-brand-700'
                      }`}>
                        {booking.channel === 'otc' ? 'OTC' : 'Online'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-700">{nf(booking.amount, booking.currency)}</td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded-md border border-neutral-200 px-2 py-1 text-xs"
                        value={booking.status}
                        onChange={(event) => setBookingStatus(booking.id, event.target.value as typeof booking.status)}
                      >
                        {['confirmed', 'pending', 'cancelled', 'refunded'].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-500">No bookings for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
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
