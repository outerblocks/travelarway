import { createFileRoute } from '@tanstack/react-router';
import { StaysDetailPage } from '@/pages/stays/StaysDetailPage';

export const Route = createFileRoute('/stays/detail')({ component: StaysDetailPage });
