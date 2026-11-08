import { LegalPolicyPage } from '@/pages/info/LegalPolicyPage';
import { PRIVACY_BODY, PRIVACY_EFFECTIVE_DATE, PRIVACY_LAST_UPDATED } from '@/pages/info/travelar-privacy';

export function PrivacyPage() {
  return (
    <LegalPolicyPage
      title="Travelar Privacy Policy"
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      lastUpdated={PRIVACY_LAST_UPDATED}
      body={PRIVACY_BODY}
      skipSelf="privacy"
    />
  );
}
