import { useNavigate, Link } from '@/router';
import { ArrowLeft } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { ErrorState, SearchSummaryBar } from '@/components/shared/States';

export function ExperiencesDetailPage() {
  const navigate = useNavigate();
  const { tp } = useI18n();

  return (
    <>
      <SearchSummaryBar>
        <Link to="/experiences/results" className="btn-ghost text-label"><ArrowLeft size={16} /> {tp('backToResults')}</Link>
      </SearchSummaryBar>
      <ErrorState message={tp('experienceNotFound')} onRetry={() => navigate('/experiences/results')} />
    </>
  );
}
