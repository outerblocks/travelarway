import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { PrivacyPage } from '@/pages/info/PrivacyPage';

export const Route = createFileRoute('/privacy')({
  ...routeSeo('/privacy'),
  component: PrivacyPage,
});
