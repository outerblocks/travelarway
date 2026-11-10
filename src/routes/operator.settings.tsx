import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { OperatorSettingsPage } from '@/pages/operator/OperatorSettingsPage';

export const Route = createFileRoute('/operator/settings')({
  ...routeSeo('/operator/settings'),
  component: OperatorSettingsPage,
});
