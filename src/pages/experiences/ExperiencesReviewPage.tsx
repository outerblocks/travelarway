import { useNavigate, Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { ErrorState, SearchSummaryBar } from '@/components/shared/States';

export function ExperiencesReviewPage() {
  const navigate = useNavigate();
  const { tp } = useI18n();

  return (
    <>
      <SearchSummaryBar>
        <Link to="/experiences/detail" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('checkoutBack')}</Link>
      </SearchSummaryBar>
      <ErrorState message={tp('experienceNotFound')} onRetry={() => navigate('/experiences/results')} />
    </>
  );
}
