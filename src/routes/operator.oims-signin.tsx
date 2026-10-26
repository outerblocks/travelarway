import { createFileRoute } from '@tanstack/react-router';
import { OimsSignInPage } from '@/pages/operator/OimsSignInPage';

export const Route = createFileRoute('/operator/oims-signin')({ component: OimsSignInPage });
