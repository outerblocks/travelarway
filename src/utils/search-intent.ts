const STORAGE_KEY = 'travelar.searchIntent';

export function rememberSearchIntent(token: string | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  if (!token) return;
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function readStoredSearchIntent(): string {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(STORAGE_KEY) ?? '';
}
