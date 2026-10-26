import { createFileRoute } from '@tanstack/react-router';
import { HimsSignInPage } from '@/pages/operator/HimsSignInPage';

export const Route = createFileRoute('/operator/hims-signin')({ component: HimsSignInPage });
