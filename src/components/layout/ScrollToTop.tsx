import { useEffect, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import { ConnectionNotice } from '@/components/shared/States';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

export function OfflineBanner() {
  // Always start "online" so SSR HTML matches the first client paint. Node 22 exposes
  // `navigator.onLine` as false, which previously rendered the banner on the server only.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (online) return null;
  return <ConnectionNotice />;
}
