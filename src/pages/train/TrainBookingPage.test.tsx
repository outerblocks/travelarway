import { useLayoutEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
import { TrainBookingPage } from '@/pages/train/TrainBookingPage';
import { TrainReviewPage } from '@/pages/train/TrainReviewPage';

const OUTBOUND_TRIP = '11111111-1111-4111-8111-111111111111';
const RETURN_TRIP = '22222222-2222-4222-8222-222222222222';

/**
 * A two-coach Business class in the shape `/cars` returns it. Rows and columns are 0-based
 * here because that is how the layout grid is authored; the map shifts them to make room for
 * the vestibule, and the assertions below are written against what the passenger sees.
 */
function cars(coachNo: number, firstSeat: number) {
  return {
    coachNo,
    seatClassCode: 'BUSINESS',
    gridRows: 2,
    gridCols: 4,
    aisleAfterRow: 2,
    capacity: 4,
    availableCount: 4,
    seats: [
      { seatNumber: firstSeat, seatLabel: String(firstSeat), row: 0, col: 0, position: 'WINDOW', seatKind: 'STANDARD', state: 'AVAILABLE' },
      { seatNumber: firstSeat + 1, seatLabel: String(firstSeat + 1), row: 0, col: 1, position: 'AISLE', seatKind: 'STANDARD', state: 'AVAILABLE' },
      { seatNumber: firstSeat + 2, seatLabel: String(firstSeat + 2), row: 0, col: 2, position: 'AISLE', seatKind: 'STANDARD', state: 'SOLD' },
      { seatNumber: firstSeat + 3, seatLabel: String(firstSeat + 3), row: 0, col: 3, position: 'WINDOW', seatKind: 'STANDARD', state: 'AVAILABLE' },
    ],
  };
}

function quoteFor(total: number) {
  return { unitFare: total, currency: 'TZS', fareSource: 'PROVISIONAL', total, lines: [{ label: 'adult', count: 1, amount: total }] };
}

const holdRequests: { url: string; body: string }[] = [];

function installFetch(options: { failHold?: boolean } = {}) {
  holdRequests.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/cars')) {
        return Response.json({
          seatClassCode: 'BUSINESS',
          defaultCoachNo: 2,
          seatSelection: 'PER_SEAT',
          cars: [cars(2, 10), cars(3, 20)],
        });
      }
      if (url.includes('/quote')) {
        return Response.json(quoteFor(url.includes(RETURN_TRIP) ? 80_500 : 80_500));
      }
      if (url.includes('/holds')) {
        if (init?.method === 'POST') {
          holdRequests.push({ url, body: String(init.body ?? '') });
          if (options.failHold) {
            return Response.json({ error: 'seats_unavailable', seats: [{ coachNo: 2, seatNumber: 10 }] }, { status: 409 });
          }
          return Response.json({ holdId: `hold-${holdRequests.length}`, seats: [], reused: false, ttlSeconds: 300 }, { status: 201 });
        }
        return new Response(null, { status: 204 });
      }
      return Response.json({ error: 'unexpected_request', url }, { status: 400 });
    }),
  );
}

function SeedTrainSearch({ roundTrip = false }: { roundTrip?: boolean }) {
  const { setSearchParams } = useApp();

  useLayoutEffect(() => {
    setSearchParams({
      mode: 'train',
      origin: 'Dar es Salaam',
      destination: 'Dodoma',
      date: '2026-11-03',
      adults: 1,
      children: 0,
      infants: 0,
      returnDate: roundTrip ? '2026-11-08' : undefined,
      extras: {
        trainId: OUTBOUND_TRIP,
        classId: 'BUSINESS',
        fromSeq: '0',
        toSeq: '2',
        trainName: 'Dar es Salaam → Dodoma | EXPRESS',
        operatorName: 'Tanzania Railways Corporation',
        legOrigin: 'Dar es Salaam',
        legDestination: 'Dodoma',
        legDeparture: '06:00',
        legArrival: '09:50',
        legDuration: '3h 50m',
        legDate: '2026-11-03',
        classLabel: 'Business',
        ...(roundTrip
          ? {
              tripType: 'return',
              returnTrainId: RETURN_TRIP,
              returnClassId: 'BUSINESS',
              returnFromSeq: '0',
              returnToSeq: '2',
              returnTrainName: 'Dodoma → Dar es Salaam | EXPRESS',
              returnOperatorName: 'Tanzania Railways Corporation',
              returnLegOrigin: 'Dodoma',
              returnLegDestination: 'Dar es Salaam',
              returnLegDeparture: '05:15',
              returnLegArrival: '09:09',
              returnLegDuration: '3h 54m',
              returnLegDate: '2026-11-08',
              returnClassLabel: 'Business',
            }
          : {}),
      },
    });
  }, [setSearchParams, roundTrip]);

  return null;
}

async function renderTrainBooking(roundTrip = false, options: { failHold?: boolean } = {}) {
  installFetch(options);
  const rootRoute = createRootRoute({ component: Outlet });
  const bookingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/train/booking',
    component: TrainBookingPage,
  });
  const reviewRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/train/review',
    component: TrainReviewPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([bookingRoute, reviewRoute]),
    history: createMemoryHistory({ initialEntries: ['/train/booking'] }),
  });
  await router.load();

  return render(
    <I18nProvider>
      <AppProvider>
        <SeedTrainSearch roundTrip={roundTrip} />
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TrainBookingPage', () => {
  it('draws the trip layout from the endpoint and refuses a seat another passenger holds', async () => {
    await renderTrainBooking();

    // The map draws one coach at a time, so 4 seats are visible with a second coach waiting
    // in the strip. One of the four is SOLD and cannot be picked.
    const seatButtons = await screen.findAllByRole('button', { name: /Seat \d+ ·/ });
    expect(seatButtons).toHaveLength(4);
    const taken = screen.getByRole('button', { name: /Seat 12 ·/ });
    expect(taken).toBeDisabled();
    expect(screen.getByRole('button', { name: /Seat 10 ·/ })).toBeEnabled();
    // Both coaches of the selected class are offered as the operator presents them.
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('requires SGR identity and contact fields while keeping account creation optional', async () => {
    const user = userEvent.setup();
    await renderTrainBooking();

    await screen.findByLabelText(/Identity No\. \/ Passport Number/);
    expect(screen.getByText('Book as a guest. Creating an account is optional and is not required to continue.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue to Review' }));

    expect((await screen.findAllByText('Required')).length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('Pick a seat for every passenger')).toBeInTheDocument();
    expect(screen.getByLabelText(/Identity No\. \/ Passport Number/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/Phone Number/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('group', { name: /Do you use a wheelchair/ })).toHaveAttribute('aria-invalid', 'true');
  });

  // Twelve sequential userEvent steps plus two round trips to the stubbed server: this is the
  // slowest test in the suite and overruns the 5s default when the rest runs alongside.
  it('holds the chosen seat in the database before taking the passenger to review', { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    await renderTrainBooking();

    await user.type(await screen.findByLabelText(/Full name as on ID/), 'Amina Mushi');
    await user.type(screen.getByLabelText(/Email/), 'amina@example.com');
    await user.type(screen.getByLabelText(/Phone Number/), '712345678');
    await user.type(screen.getByLabelText(/Identity No\. \/ Passport Number/), 'TZ-123456');
    // The ticket type prices the seat and is no longer pre-selected, so a traveller has to
    // state it. Nothing may assume an adult is on this booking.
    await user.click(screen.getByRole('button', { name: /Ticket type/ }));
    await user.click(await screen.findByRole('option', { name: 'Adult (13 and above)' }));
    await user.click(screen.getByRole('button', { name: /Residency status/ }));
    await user.click(screen.getByRole('option', { name: 'Resident' }));
    await user.click(screen.getByRole('button', { name: /Luggage/ }));
    await user.click(screen.getByRole('option', { name: 'No' }));
    await user.click(screen.getByRole('radio', { name: 'No' }));
    await user.click(screen.getByRole('button', { name: /Seat 10 ·/ }));
    await user.click(screen.getByRole('button', { name: 'Continue to Review' }));

    expect(await screen.findByRole('heading', { name: 'Review your booking' })).toBeInTheDocument();

    // The hold was asked for with the seat the passenger picked and the interval they travel.
    expect(holdRequests).toHaveLength(1);
    const sent = JSON.parse(holdRequests[0].body);
    expect(sent).toMatchObject({ tripId: OUTBOUND_TRIP, fromSeq: 0, toSeq: 2, seats: [{ coachNo: 2, seatNumber: 10 }] });
    expect(typeof sent.holdKey).toBe('string');

    // Review prices from the server, not from anything the page carried over. The line and the
    // total are the same number for one adult, so both are read rather than one guessed.
    expect(screen.getByText('Amina Mushi')).toBeInTheDocument();
    expect(screen.getByText(/Identity No\. \/ Passport Number: \*\*\*\*3456/)).toBeInTheDocument();
    expect(screen.getAllByText('TSh 80,500')).toHaveLength(2);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument());
  });

  it('keeps the return leg and combined fare visible when entering passenger details', async () => {
    await renderTrainBooking(true);

    expect(await screen.findByText('Choose seats for the return journey')).toBeInTheDocument();
    expect(screen.getAllByRole('tablist', { name: 'Coaches' })).toHaveLength(2);
    expect(screen.getByText('TSh 161,000')).toBeInTheDocument();
  });

  it('keeps the passenger on the page and re-reads the map when the seat went while they typed', async () => {
    const user = userEvent.setup();
    await renderTrainBooking(false, { failHold: true });

    await user.type(await screen.findByLabelText(/Full name as on ID/), 'Amina Mushi');
    await user.type(screen.getByLabelText(/Email/), 'amina@example.com');
    await user.type(screen.getByLabelText(/Phone Number/), '712345678');
    await user.type(screen.getByLabelText(/Identity No\. \/ Passport Number/), 'TZ-123456');
    await user.click(screen.getByRole('button', { name: /Ticket type/ }));
    await user.click(await screen.findByRole('option', { name: 'Adult (13 and above)' }));
    await user.click(screen.getByRole('button', { name: /Residency status/ }));
    await user.click(screen.getByRole('option', { name: 'Resident' }));
    await user.click(screen.getByRole('button', { name: /Luggage/ }));
    await user.click(screen.getByRole('option', { name: 'No' }));
    await user.click(screen.getByRole('radio', { name: 'No' }));
    await user.click(screen.getByRole('button', { name: /Seat 10 ·/ }));
    await user.click(screen.getByRole('button', { name: 'Continue to Review' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Those seats are no longer available');
    // Still on the seat page: a refused hold must not walk the passenger into a review that
    // claims seats they do not have.
    expect(screen.queryByRole('heading', { name: 'Review your booking' })).not.toBeInTheDocument();
  }, 20_000);
});
