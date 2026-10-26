import { createFileRoute } from '@tanstack/react-router';
import { SignInPage } from '@/pages/account/SignInPage';

export const Route = createFileRoute('/signin')({ component: SignInPage });
