import { createFileRoute } from '@tanstack/react-router';
import { PartnersPage } from '@/pages/info/PartnersPage';

export const Route = createFileRoute('/partners')({ component: PartnersPage });
