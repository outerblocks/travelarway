import { createFileRoute } from '@tanstack/react-router';
import { ConfirmationPage } from '@/pages/shared/ConfirmationPage';

export const Route = createFileRoute('/confirmation')({ component: ConfirmationPage });
