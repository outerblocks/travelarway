import { createFileRoute } from '@tanstack/react-router';
import { HelpPage } from '@/pages/info/HelpPage';

export const Route = createFileRoute('/help')({ component: HelpPage });
