import type { SearchParams } from '@/types';

/** Database row id when the search card supplied one, otherwise the display string. */
export function originToken(params: SearchParams): string {
  return params.extras?.originId?.trim() || params.origin?.trim() || '';
}

export function destinationToken(params: SearchParams): string {
  return params.extras?.destinationId?.trim() || params.destination?.trim() || '';
}
