import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { AcceptInvitePage } from '@/pages/account/AcceptInvitePage';

export const Route = createFileRoute('/invite/accept')({
  ...routeSeo('/invite/accept'),
  component: AcceptInvitePage,
});
