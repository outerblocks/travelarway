import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Calendar, Users, DollarSign, Bus as BusIcon, TrendingUp, Wrench,
  Clock, MapPin, CheckCircle2, XCircle, AlertCircle, Plus, Search,
  ArrowRight, Circle, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n, type TranslationKey } from '@/context/I18nContext';
import { OperatorManagementLayout, type MgmtSection, type OperatorInfo } from '@/components/layout/OperatorManagementLayout';
import { BUS_OPERATORS, type OperatorBooking, type BusVehicle, type ScheduleItem } from '@/data/operatorData';

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'TZS') return `TSh ${amount.toLocaleString()}`;
  if (currency === 'USD') return `$${amount.toLocaleString()}`;
  return `${currency} ${amount.toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const BOOKING_STATUS_META: Record<OperatorBooking['status'], { labelKey: TranslationKey; class: string; icon: LucideIcon }> = {
  confirmed: { labelKey: 'confirmed', class: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  pending: { labelKey: 'pending', class: 'bg-amber-50 text-amber-700', icon: Clock },
  cancelled: { labelKey: 'cancelled', class: 'bg-red-50 text-red-600', icon: XCircle },
  refunded: { labelKey: 'refunded', class: 'bg-neutral-100 text-neutral-500', icon: AlertCircle },
};

const VEHICLE_STATUS_META: Record<BusVehicle['status'], { labelKey: TranslationKey; class: string; dot: string }> = {
  active: { labelKey: 'active', class: 'text-emerald-600', dot: 'bg-emerald-500' },
  maintenance: { labelKey: 'maintenance', class: 'text-amber-600', dot: 'bg-amber-500' },
  retired: { labelKey: 'retired', class: 'text-neutral-400', dot: 'bg-neutral-400' },
};

const SCHEDULE_STATUS_META: Record<ScheduleItem['status'], { labelKey: TranslationKey; class: string }> = {
  scheduled: { labelKey: 'scheduled', class: 'bg-blue-50 text-blue-600' },
  boarding: { labelKey: 'boarding', class: 'bg-amber-50 text-amber-600' },
  departed: { labelKey: 'departed', class: 'bg-violet-50 text-violet-600' },
  completed: { labelKey: 'completed', class: 'bg-emerald-50 text-emerald-600' },
  cancelled: { labelKey: 'cancelled', class: 'bg-red-50 text-red-600' },
};

export function BusOperatorDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedOperatorId, setSelectedOperatorId] = useState(BUS_OPERATORS[0].operatorId);
  const [activeSection, setActiveSection] = useState<MgmtSection>('overview');

  if (!user) return <Navigate to="/signin" replace />;

  const operator = BUS_OPERATORS.find((op) => op.operatorId === selectedOperatorId) ?? BUS_OPERATORS[0];
  const operatorInfo: OperatorInfo = { operatorId: operator.operatorId, operatorName: operator.operatorName, operatorLogo: operator.operatorLogo };
  const allOperatorInfos: OperatorInfo[] = BUS_OPERATORS.map((op) => ({ operatorId: op.operatorId, operatorName: op.operatorName, operatorLogo: op.operatorLogo }));
  const totalSeats = operator.trips.reduce((sum) => sum + 44, 0);
  const availableSeats = operator.trips.reduce((sum, trip) => sum + trip.availableSeats, 0);
  const occupancyRate = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;
  const activeVehicles = operator.fleet.filter((v) => v.status === 'active').length;
  const inMaintenance = operator.fleet.filter((v) => v.status === 'maintenance').length;

  return (
    <OperatorManagementLayout operator={operatorInfo} mode="bus" operators={allOperatorInfos} selectedOperatorId={selectedOperatorId} onSelectOperator={setSelectedOperatorId} activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === 'overview' && <Overview operator={operator} occupancyRate={occupancyRate} activeVehicles={activeVehicles} inMaintenance={inMaintenance} t={t} />}
      {activeSection === 'schedules' && <Schedules operator={operator} t={t} />}
      {activeSection === 'fleet' && <Fleet operator={operator} t={t} />}
      {activeSection === 'bookings' && <Bookings operator={operator} t={t} />}
      {activeSection === 'analytics' && <Analytics operator={operator} t={t} />}
    </OperatorManagementLayout>
  );
}

function Overview({ operator, occupancyRate, activeVehicles, inMaintenance, t }: {
  operator: typeof BUS_OPERATORS[0]; occupancyRate: number; activeVehicles: number; inMaintenance: number; t: (key: TranslationKey) => string;
}) {
  const recentBookings = [...operator.bookings].sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={BusIcon} label={t('activeTrips')} value={String(operator.activeTrips)} accent="brand" />
        <KPI icon={Users} label={t('totalBookings')} value={String(operator.totalBookings)} accent="blue" />
        <KPI icon={TrendingUp} label={t('occupancyRate')} value={`${occupancyRate}%`} accent="emerald" />
        <KPI icon={DollarSign} label={t('totalRevenue')} value={formatCurrency(operator.totalRevenue, operator.currency)} accent="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label={t('confirmedBookings')} value={operator.confirmedBookings} icon={CheckCircle2} color="text-emerald-600" />
        <MiniStat label={t('pendingBookings')} value={operator.pendingBookings} icon={Clock} color="text-amber-600" />
        <MiniStat label={t('activeVehicles')} value={activeVehicles} icon={BusIcon} color="text-brand-600" />
        <MiniStat label={t('inMaintenance')} value={inMaintenance} icon={Wrench} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedules */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">{t('schedules')}</h2>
            <span className="text-xs text-neutral-400">{operator.schedules.length} {t('scheduled')}</span>
          </div>
          <div className="divide-y divide-neutral-50">
            {operator.schedules.slice(0, 4).map((sch) => (
              <ScheduleRow key={sch.id} sch={sch} t={t} compact />
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-bold text-neutral-900">{t('recentBookings')}</h2>
          </div>
          <div className="divide-y divide-neutral-50">
            {recentBookings.map((bk) => {
              const meta = BOOKING_STATUS_META[bk.status];
              const StatusIcon = meta.icon;
              return (
                <div key={bk.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{bk.customerName}</p>
                    <p className="text-xs text-neutral-400">{bk.reference} · {bk.route}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.class}`}>
                    <StatusIcon size={11} /> {t(meta.labelKey)}
                  </span>
                  <span className="text-sm font-semibold text-neutral-700 shrink-0">{formatCurrency(bk.amount, bk.currency)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Schedules({ operator, t }: { operator: typeof BUS_OPERATORS[0]; t: (key: TranslationKey) => string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-900">{t('scheduleManagement')}</h2>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors">
          <Plus size={16} /> {t('addTrip')}
        </button>
      </div>

      {operator.schedules.length === 0 ? (
        <EmptyState message={t('noSchedules')} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-neutral-50">
            {operator.schedules.map((sch) => (
              <ScheduleRow key={sch.id} sch={sch} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ sch, t, compact }: { sch: ScheduleItem; t: (key: TranslationKey) => string; compact?: boolean }) {
  const statusMeta = SCHEDULE_STATUS_META[sch.status];
  const fillRate = sch.totalSeats > 0 ? Math.round((sch.bookedSeats / sch.totalSeats) * 100) : 0;
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
      <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
        <BusIcon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{sch.origin} → {sch.destination}</p>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-neutral-500 flex items-center gap-1"><Clock size={11} /> {sch.departureTime} - {sch.arrivalTime}</span>
          <span className="text-xs text-neutral-500 flex items-center gap-1"><Calendar size={11} /> {formatDate(sch.departureDate)}</span>
          {!compact && <span className="text-xs text-neutral-500 flex items-center gap-1"><MapPin size={11} /> {sch.duration}</span>}
        </div>
      </div>
      {!compact && (
        <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-28">
          <span className="text-sm font-bold text-neutral-900">{sch.bookedSeats}/{sch.totalSeats}</span>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${fillRate > 80 ? 'bg-red-500' : fillRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${fillRate}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusMeta.class}`}>{t(statusMeta.labelKey)}</span>
        {!compact && (
          <button className="text-xs font-medium text-brand-600 hover:text-brand-700">{t('editSchedule')}</button>
        )}
      </div>
    </div>
  );
}

function Fleet({ operator, t }: { operator: typeof BUS_OPERATORS[0]; t: (key: TranslationKey) => string }) {
  if (operator.fleet.length === 0) return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-900">{t('fleetManagement')}</h2>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors">
          <Plus size={16} /> {t('addVehicle')}
        </button>
      </div>
      <EmptyState message={t('noVehicles')} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-neutral-900">{t('fleetManagement')}</h2>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors">
          <Plus size={16} /> {t('addVehicle')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operator.fleet.map((vehicle) => {
          const statusMeta = VEHICLE_STATUS_META[vehicle.status];
          const assignedTrip = operator.trips.find((tr) => tr.id === vehicle.assignedTripId);
          return (
            <div key={vehicle.id} className="bg-white border border-neutral-200 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <BusIcon size={22} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{vehicle.registrationNumber}</p>
                    <p className="text-xs text-neutral-400">{vehicle.model}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.class}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                  {t(statusMeta.labelKey)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-neutral-400">{t('busClass')}</p>
                  <p className="font-medium text-neutral-700">{vehicle.class}</p>
                </div>
                <div>
                  <p className="text-neutral-400">{t('totalSeats')}</p>
                  <p className="font-medium text-neutral-700">{vehicle.totalSeats}</p>
                </div>
                <div>
                  <p className="text-neutral-400">{t('mileage')}</p>
                  <p className="font-medium text-neutral-700">{vehicle.mileage.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-neutral-400">{t('lastService')}</p>
                  <p className="font-medium text-neutral-700">{formatDate(vehicle.lastService)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-400">{t('assignedTo')}</p>
                <p className="text-sm font-medium text-neutral-700">
                  {assignedTrip ? `${assignedTrip.passengerOrigin} → ${assignedTrip.passengerDestination}` : t('unassigned')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Bookings({ operator, t }: { operator: typeof BUS_OPERATORS[0]; t: (key: TranslationKey) => string }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OperatorBooking['status']>('all');

  const filtered = operator.bookings.filter((bk) => {
    const matchesSearch = !search ||
      bk.reference.toLowerCase().includes(search.toLowerCase()) ||
      bk.customerName.toLowerCase().includes(search.toLowerCase()) ||
      bk.route.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bk.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{t('bookingManagement')}</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder={t('searchBookings')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-md focus:outline-none focus:border-brand-500 w-full sm:w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OperatorBooking['status'])}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white text-neutral-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="cancelled">{t('cancelled')}</option>
            <option value="refunded">{t('refunded')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message={t('noBookings')} />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <Th>{t('ref')}</Th>
                  <Th>{t('customer')}</Th>
                  <Th>{t('route')}</Th>
                  <Th>{t('date')}</Th>
                  <Th>{t('seatNumbers')}</Th>
                  <Th>{t('amount')}</Th>
                  <Th>{t('status')}</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((bk) => {
                  const meta = BOOKING_STATUS_META[bk.status];
                  const StatusIcon = meta.icon;
                  return (
                    <tr key={bk.id} className="hover:bg-neutral-50 transition-colors">
                      <Td><span className="font-mono text-xs font-medium text-neutral-800">{bk.reference}</span></Td>
                      <Td>
                        <p className="text-sm font-medium text-neutral-900">{bk.customerName}</p>
                        <p className="text-xs text-neutral-400">{bk.customerPhone}</p>
                      </Td>
                      <Td><span className="text-xs text-neutral-600">{bk.route}</span></Td>
                      <Td><span className="text-xs text-neutral-600">{formatDate(bk.date)}</span></Td>
                      <Td><span className="text-xs text-neutral-600 font-mono">{bk.seatNumbers.join(', ')}</span></Td>
                      <Td><span className="text-sm font-semibold text-neutral-900">{formatCurrency(bk.amount, bk.currency)}</span></Td>
                      <Td><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.class}`}><StatusIcon size={11} /> {t(meta.labelKey)}</span></Td>
                      <Td>
                        <button className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
                          {t('viewDetails')} <ArrowRight size={11} />
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Analytics({ operator, t }: { operator: typeof BUS_OPERATORS[0]; t: (key: TranslationKey) => string }) {
  const history = [...operator.revenueHistory].reverse();
  const maxRevenue = Math.max(...history.map((h) => h.revenue), 1);
  const avgRevenue = Math.round(history.reduce((s, h) => s + h.revenue, 0) / history.length);
  const totalBookings14 = history.reduce((s, h) => s + h.bookings, 0);
  const avgFare = totalBookings14 > 0 ? Math.round(avgRevenue / Math.max(totalBookings14 / history.length, 1)) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-base font-bold text-neutral-900">{t('analytics')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label={t('dailyRevenue')} value={formatCurrency(avgRevenue, operator.currency)} icon={DollarSign} />
        <KPICard label={t('totalBookings')} value={String(totalBookings14)} icon={Users} />
        <KPICard label={t('avgFare')} value={formatCurrency(avgFare, operator.currency)} icon={TrendingUp} />
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-neutral-900">{t('revenueTrend')}</h3>
          <span className="text-xs text-neutral-400">{t('last14Days')}</span>
        </div>
        <div className="flex items-end gap-1.5 sm:gap-2 h-48">
          {history.map((day) => {
            const heightPct = (day.revenue / maxRevenue) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                <div className="w-full flex-1 flex items-end relative">
                  <div
                    className="w-full bg-brand-500 rounded-t-sm hover:bg-brand-600 transition-colors cursor-pointer"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                    title={`${formatDate(day.date)}: ${formatCurrency(day.revenue, operator.currency)}`}
                  />
                </div>
                <span className="text-[10px] text-neutral-400 hidden sm:block">{new Date(day.date).getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat label={t('confirmedBookings')} value={operator.confirmedBookings} icon={CheckCircle2} color="text-emerald-600" />
        <MiniStat label={t('pendingBookings')} value={operator.pendingBookings} icon={Clock} color="text-amber-600" />
        <MiniStat label={t('cancelledBookings')} value={operator.cancelledBookings} icon={XCircle} color="text-red-600" />
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: string; accent: 'brand' | 'blue' | 'emerald' | 'amber' }) {
  const colorMap = {
    brand: 'bg-brand-600', blue: 'bg-blue-600', emerald: 'bg-emerald-600', amber: 'bg-amber-600',
  };
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5">
      <div className={`w-11 h-11 ${colorMap[accent]} rounded-lg flex items-center justify-center mb-3`}>
        <Icon size={22} className="text-white" />
      </div>
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-neutral-900 truncate">{value}</p>
    </div>
  );
}

function KPICard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center">
        <Icon size={24} className="text-brand-600" />
      </div>
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-lg font-bold text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 flex items-center gap-3">
      <Icon size={20} className={color} />
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className={`text-base font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold text-neutral-500 uppercase tracking-wide">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
      <Circle size={32} className="text-neutral-300 mx-auto mb-3" />
      <p className="text-sm text-neutral-400">{message}</p>
    </div>
  );
}
