import { useNavigate } from '@/router';
import { useI18n } from '@/context/I18nContext';
import { ErrorState } from '@/components/shared/States';

export function ExperiencesReviewPage() {
  const navigate = useNavigate();
  const { tp } = useI18n();

  return (
    <ErrorState message={tp('experienceNotFound')} onRetry={() => navigate('/experiences/results')} />
  );
}
