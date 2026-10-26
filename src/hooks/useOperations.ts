import { useEffect, useState } from 'react';
import { getOperations, subscribeToOperations } from '@/data/operations';

/**
 * Subscribes a component to the operational store, so OIMS and HIMS re-render as
 * soon as a route, fare, seat map, schedule or booking changes.
 */
export function useOperations() {
  const [, force] = useState(0);
  useEffect(() => subscribeToOperations(() => force((value) => value + 1)), []);
  return getOperations();
}
