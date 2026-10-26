import { createFileRoute } from '@tanstack/react-router';
import { HqDashboardPage } from '@/pages/hq/HqDashboardPage';

export const Route = createFileRoute('/hq')({ component: HqDashboardPage });
