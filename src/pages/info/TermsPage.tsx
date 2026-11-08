import { LegalPolicyPage } from '@/pages/info/LegalPolicyPage';
import { TERMS_BODY, TERMS_EFFECTIVE_DATE, TERMS_LAST_UPDATED } from '@/pages/info/travelar-terms';

export function TermsPage() {
  return (
    <LegalPolicyPage
      title="Travelar Terms and Conditions"
      effectiveDate={TERMS_EFFECTIVE_DATE}
      lastUpdated={TERMS_LAST_UPDATED}
      intro="These Terms are published in English. If the site language is switched, the English text still applies, except where the law of your country requires a local-language version to prevail."
      body={TERMS_BODY}
      skipSelf="terms"
    />
  );
}
