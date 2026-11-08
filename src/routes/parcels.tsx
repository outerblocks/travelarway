import { createFileRoute } from '@tanstack/react-router';
import { ParcelTrackingPage } from '@/pages/shared/ParcelTrackingPage';

export const Route = createFileRoute('/parcels')({ component: ParcelTrackingPage });
