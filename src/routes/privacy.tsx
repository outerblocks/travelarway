import { createFileRoute } from '@tanstack/react-router';
import { PrivacyPage } from '@/pages/info/PrivacyPage';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});
