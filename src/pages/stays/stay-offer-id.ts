export function offerIdFromSearch(search: unknown): string {
  if (typeof search === 'string') return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('offer')?.trim() ?? '';
  if (search && typeof search === 'object' && 'offer' in search) {
    const value = (search as { offer?: unknown }).offer;
    return typeof value === 'string' ? value.trim() : '';
  }
  return '';
}
