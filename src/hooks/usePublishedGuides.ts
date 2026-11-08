import { useCallback, useEffect, useState } from 'react';
import type { Language } from '@/context/I18nContext';
import type { PublicGuide, PublicGuideSummary } from '@/server/guides';
import { isAbortError, queryFailureStatus, type QueryStatus } from '@/hooks/query-status';
import { useOnlineRetry } from '@/hooks/useOnlineRetry';

export function usePublishedGuides(locale: Language) {
  const [status, setStatus] = useState<QueryStatus>('loading');
  const [guides, setGuides] = useState<PublicGuideSummary[]>([]);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useOnlineRetry(retry);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch(`/api/guides?locale=${locale}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ data?: PublicGuideSummary[] }>;
      })
      .then((body) => {
        setGuides(Array.isArray(body.data) ? body.data : []);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setStatus(queryFailureStatus(error));
      });
    return () => controller.abort();
  }, [locale, attempt]);

  return { status, guides, retry };
}

export function usePublishedGuide(slug: string, locale: Language) {
  const [status, setStatus] = useState<QueryStatus>('loading');
  const [guide, setGuide] = useState<PublicGuide | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useOnlineRetry(retry);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch(`/api/guides/${encodeURIComponent(slug)}?locale=${locale}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) {
          setGuide(null);
          setStatus('ready');
          return null;
        }
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<{ data?: PublicGuide }>;
      })
      .then((body) => {
        if (body === null) return;
        setGuide(body.data ?? null);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setStatus(queryFailureStatus(error));
      });
    return () => controller.abort();
  }, [slug, locale, attempt]);

  return { status, guide, retry };
}
