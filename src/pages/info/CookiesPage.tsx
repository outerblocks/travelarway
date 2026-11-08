import { LegalPolicyPage } from '@/pages/info/LegalPolicyPage';
import { COOKIES_BODY, COOKIES_EFFECTIVE_DATE, COOKIES_LAST_UPDATED } from '@/pages/info/travelar-cookies';

export function CookiesPage() {
  return (
    <LegalPolicyPage
      title="Travelar Cookie Policy"
      effectiveDate={COOKIES_EFFECTIVE_DATE}
      lastUpdated={COOKIES_LAST_UPDATED}
      body={COOKIES_BODY}
      skipSelf="cookies"
    />
  );
}
