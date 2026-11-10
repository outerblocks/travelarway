import { createFileRoute } from '@tanstack/react-router';
import { routeSeo } from '@/domain/seo';
import { HqShell } from '@/pages/hq/HqShell';

export const Route = createFileRoute('/hq')({
  ...routeSeo('/hq'),
  component: HqShell,
});
