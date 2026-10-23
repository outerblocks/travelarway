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

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
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
