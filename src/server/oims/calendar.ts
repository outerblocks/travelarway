const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar date only. Service dates are not UTC instants. */
export function occurrenceDates(
  validFrom: string,
  validTo: string,
  daysOfWeek: number[],
  exceptions: { serviceDate: string; kind: 'blackout' | 'extra' }[] = [],
): string[] {
  if (!ISO_DATE.test(validFrom) || !ISO_DATE.test(validTo)) {
    throw new Error('invalid_date_range');
  }
  if (validTo < validFrom) throw new Error('invalid_date_range');
  const allowed = new Set(daysOfWeek.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6));
  if (!allowed.size && !exceptions.some((row) => row.kind === 'extra')) {
    throw new Error('invalid_operating_days');
  }

  const blackout = new Set(exceptions.filter((row) => row.kind === 'blackout').map((row) => row.serviceDate));
  const extra = exceptions.filter((row) => row.kind === 'extra').map((row) => row.serviceDate);
  const dates: string[] = [];

  for (let cursor = validFrom; cursor <= validTo; cursor = nextIsoDate(cursor)) {
    if (blackout.has(cursor)) continue;
    const weekday = isoWeekdaySundayZero(cursor);
    if (allowed.has(weekday)) dates.push(cursor);
  }
  for (const date of extra) {
    if (date < validFrom || date > validTo || blackout.has(date)) continue;
    if (!dates.includes(date)) dates.push(date);
  }
  dates.sort();
  return dates;
}

function isoWeekdaySundayZero(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function nextIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}
