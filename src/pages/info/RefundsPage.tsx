import { LegalPolicyPage } from '@/pages/info/LegalPolicyPage';
import { REFUNDS_BODY, REFUNDS_EFFECTIVE_DATE, REFUNDS_LAST_UPDATED } from '@/pages/info/travelar-refunds';

export function RefundsPage() {
  return (
    <LegalPolicyPage
      title="Travelar Cancellation and Refund Policy"
      effectiveDate={REFUNDS_EFFECTIVE_DATE}
      lastUpdated={REFUNDS_LAST_UPDATED}
      body={REFUNDS_BODY}
    />
  );
}
