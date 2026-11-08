/**
 * Hosted-checkout redirects must land on the payment provider, not an arbitrary URL
 * returned in a JSON field. Only https ClickPesa hosts are accepted.
 */
export function safePaymentRedirectUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  if (host === 'clickpesa.com' || host.endsWith('.clickpesa.com')) return url.toString();
  return null;
}
