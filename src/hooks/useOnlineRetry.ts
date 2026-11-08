import { useEffect } from 'react';

/** When the browser comes back online, retry the in-flight resource once. */
export function useOnlineRetry(retry: () => void) {
  useEffect(() => {
    const onOnline = () => retry();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [retry]);
}
