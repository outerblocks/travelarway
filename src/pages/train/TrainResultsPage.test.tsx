import { useLayoutEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { TrainResultsPage } from '@/pages/train/TrainResultsPage';

/**
 * The results page now asks the database, so these tests answer with the shape
 * `/api/sgr/services` returns rather than importing a fixture list. Two services are enough
 * to prove the round-trip handshake and that a selection carries the trip identity forward.
 */
const SERVICES = [
  {
    tripId: '11111111-1111-4111-8111-111111111111',
    serviceRef: 'SGR-0011904-2026-11-03',
    tripNumber: '0011904',
    name: 'Dar es Salaam → Dodoma | EXPRESS',
    operatorName: 'Tanzania Railways Corporation',
    servicePattern: 'EXPRESS',
    trainsetCode: 'TRC_SGR_EXPRESS',
    origin: 'Dar es Salaam',
    destination: 'Dodoma',
    departureTime: '06:00',
    arrivalTime: '09:50',
    departureDate: '2026-11-03',
    duration: '3h 50m',
    fromSeq: 0,
    toSeq: 2,
    classes: [
      { seatClassCode: 'ROYAL', name: 'Royal Class', fare: 90500, currency: 'TZS', fareSource: 'PROVISIONAL', available: 44, totalSellable: 44, soldOut: false },
      { seatClassCode: 'ECONOMY', name: 'Economy', fare: 50500, currency: 'TZS', fareSource: 'PROVISIONAL', available: 856, totalSellable: 856, soldOut: false },
    ],
  },
  {
    tripId: '22222222-2222-4222-8222-222222222222',
    serviceRef: 'SGR-011908-2026-11-03',
    tripNumber: '011908',
    name: 'Dar es Salaam → Dodoma | ORDINARY LINE',
    operatorName: 'Tanzania Railways Corporation',
    servicePattern: 'ORDINARY_LINE',
    trainsetCode: 'TRC_SGR_EXPRESS',
    origin: 'Dar es Salaam',
    destination: 'Dodoma',
    departureTime: '09:40',
    arrivalTime: '13:37',
    departureDate: '2026-11-03',
    duration: '3h 57m',
    fromSeq: 0,
    toSeq: 2,
    classes: [
      { seatClassCode: 'ECONOMY', name: 'Economy', fare: 31500, currency: 'TZS', fareSource: 'PROVISIONAL', available: 0, totalSellable: 856, soldOut: true },
    ],
  },
];

function SeedRoundTripSearch() {
  const { setSearchParams } = useApp();

  useLayoutEffect(() => {
    setSearchParams({
      mode: 'train',
      origin: 'Dar es Salaam',
      destination: 'Dodoma',
      date: '2026-11-03',
      returnDate: '2026-11-08',
      adults: 1,
      children: 0,
      infants: 0,
      extras: { tripType: 'return' },
    });
  }, [setSearchParams]);

  return null;
}

function SelectedTrainDestination() {
  const { bookingState } = useApp();
  return <output data-testid="selected-train">{JSON.stringify(bookingState.searchParams.extras)}</output>;
}

function renderPage() {
  const rootRoute = createRootRoute({ component: Outlet });
  const resultsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/train/results',
    component: TrainResultsPage,
  });
  const bookingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/train/booking',
    component: SelectedTrainDestination,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([resultsRoute, bookingRoute]),
    history: createMemoryHistory({ initialEntries: ['/train/results'] }),
  });
  return { router };
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/sgr/services')) {
        // The corridor is directional, so the stub answers the way the endpoint does:
        // a return query comes back reversed, not as the outbound list again.
        const isReturn = url.includes('from=Dodoma');
        const flipped = SERVICES.map((service) => ({
          ...service,
          origin: isReturn ? 'Dodoma' : 'Dar es Salaam',
          destination: isReturn ? 'Dar es Salaam' : 'Dodoma',
          name: isReturn
            ? 'Dodoma → Dar es Salaam | EXPRESS'
            : service.name,
        }));
        return Response.json({ data: flipped, unresolved_places: [] });
      }
      return Response.json({ error: 'unexpected_request', url }, { status: 400 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TrainResultsPage', () => {
  it('lists the services the database returned, with the fare and seat count from it', async () => {
    const { router } = renderPage();
    await router.load();

    render(
      <I18nProvider>
        <AppProvider>
          <SeedRoundTripSearch />
          <RouterProvider router={router} />
        </AppProvider>
      </I18nProvider>,
    );

    expect(await screen.findByText('2 train services found', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('TSh 90,500')).toBeInTheDocument();
    // A sold-out class says so and cannot be booked, rather than showing an empty basket.
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });

  it('requires a separate return selection before continuing to passenger details', async () => {
    const user = userEvent.setup();
    const { router } = renderPage();
    await router.load();

    render(
      <I18nProvider>
        <AppProvider>
          <SeedRoundTripSearch />
          <RouterProvider router={router} />
        </AppProvider>
      </I18nProvider>,
    );

    await screen.findByText('2 train services found', {}, { timeout: 3000 });
    await user.click((await screen.findAllByRole('button', { name: 'Book' }, { timeout: 3000 }))[0]);
    expect(await screen.findByText('Return Train search', {}, { timeout: 3000 })).toBeInTheDocument();
    // The header and the cards all state the reversed corridor, so any of them matching proves
    // the return query went out reversed.
    expect((await screen.findAllByText(/Dodoma → Dar es Salaam/, {}, { timeout: 3000 })).length).toBeGreaterThan(0);

    await user.click((await screen.findAllByRole('button', { name: 'Book' }, { timeout: 3000 }))[0]);
    await waitFor(() => expect(router.state.location.pathname).toBe('/train/booking'));

    const extras = JSON.parse(screen.getByTestId('selected-train').textContent ?? '{}');
    expect(extras).toMatchObject({
      trainId: SERVICES[0].tripId,
      classId: 'ROYAL',
      fromSeq: '0',
      toSeq: '2',
      returnTrainId: SERVICES[0].tripId,
      returnClassId: 'ROYAL',
      // Display facts the review page prints; the price is deliberately not among them.
      trainName: SERVICES[0].name,
      legDeparture: '06:00',
    });
    expect(extras).not.toHaveProperty('total');
    expect(extras).not.toHaveProperty('fare');
  }, 20_000);

  it('names a place the platform has no station for instead of claiming no trains run', async () => {
    vi.mocked(fetch).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/sgr/services')) {
        return Response.json({ data: [], unresolved_places: ['Zanzibar'] });
      }
      return Response.json({ error: 'unexpected_request' }, { status: 400 });
    });

    const { router } = renderPage();
    await router.load();
    render(
      <I18nProvider>
        <AppProvider>
          <SeedRoundTripSearch />
          <RouterProvider router={router} />
        </AppProvider>
      </I18nProvider>,
    );

    expect(await screen.findByText(/Zanzibar/, {}, { timeout: 3000 })).toBeInTheDocument();
  });
});
