export function formatCurrency(amount: number, currency: string, symbol?: string): string {
  if (currency === 'TZS' || currency === 'KES' || currency === 'UGX' || currency === 'RWF') {
    return `${symbol || currency} ${amount.toLocaleString()}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

/** Local clock from a provider date-time. Does not apply a browser timezone. */
export function formatClock(value: string): string {
  const stamped = value.match(/(?:T| )(\d{2}:\d{2})/);
  if (stamped) return stamped[1];
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  return '';
}

export function calendarDayOf(value: string): string {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? '';
}

type LocalParts = { y: number; m: number; d: number; h: number; min: number };

function localParts(value: string): LocalParts | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return null;
  return {
    y: Number(match[1]),
    m: Number(match[2]),
    d: Number(match[3]),
    h: Number(match[4] ?? 0),
    min: Number(match[5] ?? 0),
  };
}

/** Elapsed minutes between two naive local date-times (airport local, not UTC). */
export function minutesBetweenLocal(start: string, end: string): number | null {
  const from = localParts(start);
  const to = localParts(end);
  if (!from || !to) return null;
  const ms = Date.UTC(to.y, to.m - 1, to.d, to.h, to.min) - Date.UTC(from.y, from.m - 1, from.d, from.h, from.min);
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.round(ms / 60000);
}

export function isoDurationMinutes(value: string): number | null {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(value.trim());
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const total = days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60);
  return Number.isFinite(total) ? total : null;
}

export function formatDurationMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatIsoDuration(value: string): string | null {
  const minutes = isoDurationMinutes(value);
  if (minutes == null || minutes <= 0) return null;
  return formatDurationMinutes(minutes);
}

export function formatDurationLong(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourLabel = hours === 1 ? '1 hr' : `${hours} hrs`;
  const minuteLabel = rest === 1 ? '1 min' : `${rest} mins`;
  if (hours <= 0) return minuteLabel;
  if (rest === 0) return hourLabel;
  return `${hourLabel} ${minuteLabel}`;
}

/** 20:15 → 08:15 pm. Local clock only. */
export function formatClockMeridiem(value: string): string {
  const clock = formatClock(value);
  if (!clock) return '';
  const [hourRaw, minute] = clock.split(':');
  const hour24 = Number(hourRaw);
  if (!Number.isFinite(hour24)) return clock;
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${minute} ${suffix}`;
}

export function formatScheduleHeading(value: string): string {
  const day = calendarDayOf(value);
  if (!day) return formatClockMeridiem(value);
  const date = parseIsoDate(day);
  const stamp = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const clock = formatClockMeridiem(value);
  return clock ? `${stamp}, ${clock}` : stamp;
}

/**
 * Formats a Date as YYYY-MM-DD using its LOCAL calendar day.
 *
 * `toISOString()` converts to UTC first: a date built for local midnight in Dar es Salaam
 * (UTC+3) becomes the previous day at 21:00 UTC. Every calendar date in this app is a
 * local day — a departure date, not an instant — so it must never be round-tripped
 * through UTC.
 */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses YYYY-MM-DD as local midnight, the inverse of `toIsoDate`. */
export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function todayISO(): string {
  return toIsoDate(new Date());
}

export function addDays(dateStr: string, days: number): string {
  const date = parseIsoDate(dateStr);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function generateBookingRef(): string {
  const prefix = 'TRV';
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${num}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
