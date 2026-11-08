import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { AppProvider, useApp } from '@/context/AppContext';
import { I18nProvider } from '@/context/I18nContext';
import { BusResultsPage } from '@/pages/bus/BusResultsPage';

const TRIP = {
  id: '047c13c9-b62c-4ffd-a3fc-95eeda2ec349',
  operatorName: 'Kilimanjaro Express',
  operatorInitials: 'KE',
  operatorSource: 'fixture',
  seatLayoutName: 'Coach 2+2',
  vehicleModel: 'Yutong F12',
  registrationNumber: 'T 123 ABC',
  departureTime: '06:00',
  arrivalTime: '12:30',
  arrivalNextDay: false,
  durationLabel: '6h 30m',
  passengerOrigin: 'Dar es Salaam',
  passengerDestination: 'Dodoma',
  departureTerminal: 'Ubungo Terminal',
  arrivalTerminal: 'Dodoma Central',
  intermediateStops: [{ name: 'Morogoro', terminal: 'Morogoro Bus Stand' }],
  segmentFare: 29000,
  currency: 'TZS',
  capacity: 49,
  availableSeats: 44,
  // The regulated LATRA category, distinct from the operator's own marketing label.
  serviceClass: 'semi_luxury',
  supportPhone: '+255 748 000 111',
  amenities: [],
};

function Seed() {
  const { setSearchParams } = useApp();
  useEffect(() => {
    setSearchParams({
      mode: 'bus',
      origin: 'Dar es Salaam',
      destination: 'Dodoma',
      date: '2026-10-30',
      adults: 1,
      children: 0,
      infants: 0,
    });
  }, [setSearchParams]);
  return null;
}

async function renderResults() {
  const rootRoute = createRootRoute({ component: Outlet });
  const resultsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'bus/results',
    component: BusResultsPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([resultsRoute]),
    history: createMemoryHistory({ initialEntries: ['/bus/results'] }),
  });
  await router.load();

  return render(
    <I18nProvider>
      <AppProvider>
        <Seed />
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>,
  );
}

const respondWith = (body: unknown) =>
  vi.fn().mockResolvedValue({ ok: true, json: async () => body } as Response);

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('BusResultsPage', () => {
  it('shows a loading state before the search resolves, then renders real results', async () => {
    vi.stubGlobal('fetch', respondWith({ data: [TRIP] }));
    await renderResults();

    // Loading is a skeleton region, never an empty list that looks like "no trips".
    expect(document.querySelector('[role="status"]')).not.toBeNull();

    await waitFor(() => expect(screen.getByText('Kilimanjaro Express')).toBeInTheDocument());
    expect(screen.getByText(/44 \/ 49/)).toBeInTheDocument();
    expect(screen.getByText(/Sample inventory/)).toBeInTheDocument();
  });

  it('shows an empty state — not a fabricated trip — when the API returns nothing', async () => {
    vi.stubGlobal('fetch', respondWith({ data: [] }));
    const { container } = await renderResults();

    await waitFor(() => expect(container.querySelectorAll('article')).toHaveLength(0));
    expect(screen.queryByText('Kilimanjaro Express')).not.toBeInTheDocument();
  });

  it('shows an error state with retry when the search fails, and retries the request', async () => {
    const failing = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', failing);
    const { container } = await renderResults();

    await waitFor(() => expect(container.querySelectorAll('article')).toHaveLength(0));

    const callsBeforeRetry = failing.mock.calls.length;
    const retryButton = await screen.findByRole('button', { name: /retry|try again/i });
    retryButton.click();
    await waitFor(() => expect(failing.mock.calls.length).toBeGreaterThan(callsBeforeRetry));
  });

  it('does not fall back to fixture data when the API returns nothing', async () => {
    vi.stubGlobal('fetch', respondWith({ data: [] }));
    const { container } = await renderResults();

    await waitFor(() => expect(container.querySelectorAll('article')).toHaveLength(0));
    // The old implementation returned getBusTrips() here; that path is gone.
    expect(screen.queryByText('Yutong F12 · T 123 ABC')).not.toBeInTheDocument();
  });
});
