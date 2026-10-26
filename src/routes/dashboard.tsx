import { createFileRoute } from '@tanstack/react-router';
import { DashboardPage } from '@/pages/account/DashboardPage';

export const Route = createFileRoute('/dashboard')({ component: DashboardPage });
