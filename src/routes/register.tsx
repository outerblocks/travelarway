import { createFileRoute } from '@tanstack/react-router';
import { RegisterPage } from '@/pages/account/RegisterPage';

export const Route = createFileRoute('/register')({ component: RegisterPage });
