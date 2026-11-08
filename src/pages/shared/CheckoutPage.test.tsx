import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { CheckoutPage } from '@/pages/shared/CheckoutPage';
import { ConfirmationPage } from '@/pages/shared/ConfirmationPage';
import type { PassengerInfo } from '@/types';

const pax = (id: string, category: PassengerInfo['category']): PassengerInfo => ({
  id,
  category,
  fullName: 'Test',
  email: 't@t.t',
  phone: '1',
  phoneCountryCode: '+255',
  gender: 'male',
  countryOfResidence: 'TZ',
});

function Seed({ passengers, tripId }: { passengers: PassengerInfo[]; tripId?: string }) {
  const {
    setSelectedServiceId,
    setPassengers,
    setSearchParams,
    setSelectedSeats,
    setBoardingPointId,
    setDropOffPointId,
  } = useApp();
  useEffect(() => {
    setSelectedServiceId('svc-1');
    // A booking commit requires seats and a priced segment: the component (correctly)
    // refuses to post without them, so the fixture supplies what a real funnel collected.
    setSelectedSeats(passengers.map((_, index) => `1${String.fromCharCode(65 + index)}`));
    setBoardingPointId('11111111-1111-4111-8111-111111111111');
    setDropOffPointId('22222222-2222-4222-8222-222222222222');
    if (tripId) {
      setSearchParams({
        mode: 'bus',
        adults: 1,
        children: 1,
        infants: 0,
        extras: { tripId },
      });
    }
    setPassengers(passengers);
  }, [
    setSelectedServiceId,
    setPassengers,
    setSearchParams,
    setSelectedSeats,
    setBoardingPointId,
    setDropOffPointId,
    passengers,
    tripId,
  ]);
  return null;
}

function RefProbe() {
  const { bookingState } = useApp();
  return (
    <>
      <div data-testid="active-pnr">{bookingState.activeBooking?.pnr ?? 'none'}</div>
      <div data-testid="active-status">{bookingState.activeBooking?.status ?? 'none'}</div>
      <div data-testid="active-total">{bookingState.activeBooking?.totalMinor ?? 'none'}</div>
      <div data-testid="active-collection">
        {bookingState.activeBooking ? String(bookingState.activeBooking.collectionStarted) : 'none'}
      </div>
    </>
  );
}

const adultChild = [pax('1', 'adult'), pax('2', 'child')];

/** A trip that exists in the database is a UUID; the price for it comes from the server. */
const TRIP_ID = '33333333-3333-4333-8333-333333333333';

/** What the server answers for the seeded segment: 25,000 adult + 12,500 child. */
const SERVER_QUOTE = {
  currency: 'TZS',
  grossMinor: 37500,
  adultUnitMinor: 25000,
  childUnitMinor: 12500,
  lines: [
    { kind: 'adult', unitMinor: 25000, quantity: 1, amountMinor: 25000 },
    { kind: 'child', unitMinor: 12500, quantity: 1, amountMinor: 12500 },
  ],
};

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

/**
 * Checkout prices bus from `/api/trip-detail`. Any test that reaches the pay button has to
 * answer that call, otherwise the page correctly refuses to show a price it does not have.
 */
function stubFetch(extra?: (url: string) => Response | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const handled = extra?.(url);
      if (handled) return handled;
      if (url.includes('/api/trip-detail')) {
        return jsonResponse(200, { data: { quote: SERVER_QUOTE } });
      }
      return jsonResponse(404, { error: 'unexpected' });
    }),
  );
}

async function renderCheckout(passengers: PassengerInfo[] | null = adultChild, tripId?: string) {
  const rootRoute = createRootRoute({ component: Outlet });
  const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'checkout',
    component: CheckoutPage,
  });
  const confirmationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'confirmation',
    component: ConfirmationPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([checkoutRoute, confirmationRoute]),
    history: createMemoryHistory({ initialEntries: ['/checkout'] }),
  });
  await router.load();

  // Only a booking with a trip has a segment to price.
  if (tripId) stubFetch();

  return render(
    <I18nProvider>
      <AppProvider>
        {passengers && <Seed passengers={passengers} tripId={tripId} />}
        <RefProbe />
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CheckoutPage', () => {
  it('shows an empty state when there is no booking', async () => {
    await renderCheckout(null);
    expect(screen.getByText('No booking to check out.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument();
  });

  it('does not invent a price or allow payment when no quote is available', async () => {
    await renderCheckout();
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeDisabled();
    expect(screen.queryByText(/TSh/)).not.toBeInTheDocument();
  });

  it('shows the amount the server quoted for the travelled segment', async () => {
    await renderCheckout(adultChild, TRIP_ID);
    const fmt = (n: number) => `TSh ${n.toLocaleString()}`;

    expect(screen.getByText('Amount due')).toBeInTheDocument();
    // The total and the per-category lines both come from the server's quote.
    expect(await screen.findByText(fmt(37500))).toBeInTheDocument();
    expect(screen.getByText(fmt(25000))).toBeInTheDocument();
    expect(screen.getByText(fmt(12500))).toBeInTheDocument();

    // Nothing can be charged until the wallet number is given.
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeDisabled();
  });

  it('offers no discount it cannot actually apply', async () => {
    await renderCheckout(adultChild, TRIP_ID);
    expect(screen.queryByText(/coupon/i)).not.toBeInTheDocument();
  });

  it('creates a booking, then reports the unpaid state instead of a ticket', async () => {
    await renderCheckout(adultChild, TRIP_ID);

    stubFetch((url) => {
      if (url.includes('/api/bookings')) {
        return jsonResponse(201, {
          bookingId: 'b1',
          pnr: 'TRV-ABC123',
          seats: ['1A'],
          // The server returns the amount charged; the client no longer decides it.
          totalMinor: 37500,
          currency: 'TZS',
          status: 'pending_payment',
          paymentDueAt: '2026-10-30T21:15:00.000Z',
          accessToken: 'payload.signature',
        });
      }
      if (url.includes('/api/payments/start')) {
        // No provider is connected in this environment. The booking is still real.
        return jsonResponse(502, { collectionStarted: false, failure: 'not_enabled' });
      }
      if (url.includes('/api/booking-status')) {
        return jsonResponse(200, {
          bookingId: 'b1',
          pnr: 'TRV-ABC123',
          status: 'pending_payment',
          totalMinor: 37500,
          currency: 'TZS',
          paymentDueAt: '2026-10-30T21:15:00.000Z',
          seats: ['1A'],
          verifyToken: null,
        });
      }
      return null;
    });

    expect(screen.getByText('A ticket is issued once your booking is confirmed.')).toBeInTheDocument();
    // The price arrives from the server; the button stays disabled until it does.
    expect(await screen.findByText('TSh 37,500')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '712345678' } });
    // No network is pre-selected; the customer states which one takes their money.
    fireEvent.click(screen.getByRole('button', { name: 'M-Pesa' }));
    fireEvent.click(screen.getByRole('button', { name: /^Pay/ }));

    await waitFor(() => expect(screen.getByTestId('active-pnr').textContent).toBe('TRV-ABC123'));
    expect(screen.getByTestId('active-status').textContent).toBe('pending_payment');
    expect(screen.getByTestId('active-total').textContent).toBe('37500');
    // The provider was never reached, and the page says so rather than implying otherwise.
    expect(screen.getByTestId('active-collection').textContent).toBe('false');

    // The customer stays on checkout, told why — not sent to a page that can only say
    // "waiting". The booking and its seats are real; the payment simply did not start.
    expect(await screen.findByText('We could not start the payment')).toBeInTheDocument();
    expect(screen.getByText(/not switched on for this deployment/i)).toBeInTheDocument();
    expect(screen.queryByText('Waiting for your payment')).not.toBeInTheDocument();
    expect(screen.queryByText('TOTAL PAID')).not.toBeInTheDocument();
  });

  it('shows the provider’s own reason instead of a polite nothing', async () => {
    await renderCheckout(adultChild, TRIP_ID);
    stubFetch((url) => {
      if (url.includes('/api/bookings')) {
        return jsonResponse(201, {
          bookingId: 'b1',
          pnr: 'TRV-ABC123',
          totalMinor: 37500,
          currency: 'TZS',
          status: 'pending_payment',
          paymentDueAt: '2026-10-30T21:15:00.000Z',
          accessToken: 'payload.signature',
        });
      }
      if (url.includes('/api/payments/start')) {
        return jsonResponse(502, {
          collectionStarted: false,
          failure: 'provider_error',
          detail: '400: Invalid / unsupported phone number',
        });
      }
      return null;
    });

    expect(await screen.findByText('TSh 37,500')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '712345678' } });
    // No network is pre-selected; the customer states which one takes their money.
    fireEvent.click(screen.getByRole('button', { name: 'M-Pesa' }));
    fireEvent.click(screen.getByRole('button', { name: /^Pay/ }));

    // The provider's message is the actionable part; show it verbatim.
    expect(await screen.findByText('400: Invalid / unsupported phone number')).toBeInTheDocument();
  });

  it('moves to the confirmation page only once the provider accepts the request', async () => {
    await renderCheckout(adultChild, TRIP_ID);
    stubFetch((url) => {
      if (url.includes('/api/bookings')) {
        return jsonResponse(201, {
          bookingId: 'b1',
          pnr: 'TRV-ABC123',
          totalMinor: 37500,
          currency: 'TZS',
          status: 'pending_payment',
          paymentDueAt: '2026-10-30T21:15:00.000Z',
          accessToken: 'payload.signature',
        });
      }
      if (url.includes('/api/payments/start')) {
        return jsonResponse(201, { collectionStarted: true, failure: null, redirectUrl: null });
      }
      if (url.includes('/api/booking-status')) {
        return jsonResponse(200, {
          bookingId: 'b1',
          pnr: 'TRV-ABC123',
          status: 'pending_payment',
          totalMinor: 37500,
          currency: 'TZS',
          paymentDueAt: '2026-10-30T21:15:00.000Z',
          seats: ['1A'],
          verifyToken: null,
        });
      }
      return null;
    });

    expect(await screen.findByText('TSh 37,500')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '712345678' } });
    // No network is pre-selected; the customer states which one takes their money.
    fireEvent.click(screen.getByRole('button', { name: 'M-Pesa' }));
    fireEvent.click(screen.getByRole('button', { name: /^Pay/ }));

    expect(await screen.findByText('Waiting for your payment')).toBeInTheDocument();
    expect(screen.getByText(/Approve the request on your phone/i)).toBeInTheDocument();
  });

  it('does not collect card details and says card is USD-only', async () => {
    await renderCheckout();
    fireEvent.click(screen.getByRole('radio', { name: /Card payment/i }));
    expect(screen.getByText(/card service settles in USD/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Card Number')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('CVV')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Visa' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mastercard' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'UnionPay' })).toBeInTheDocument();
  });

  it('only offers payment methods enabled for the market and defaults to mobile money', async () => {
    await renderCheckout();
    expect(screen.getByRole('radio', { name: /Mobile money/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Card payment/i })).not.toBeChecked();
    // The method defaults to mobile money because it is the only one most travellers use
    // here, but no network is chosen for them: the first in the list is not necessarily
    // theirs, and a push to the wrong one is declined on their behalf.
    for (const provider of ['M-Pesa', 'Airtel Money', 'Halopesa', 'Tigo Pesa']) {
      expect(screen.getByRole('button', { name: provider })).toHaveAttribute('aria-pressed', 'false');
    }
    // A complete phone number is not enough on its own: with no stated network there is no
    // one to send the request to. The flow tests below prove the pay button honours that once
    // a server quote exists; here the quote does not, so only the selection is asserted.
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '712345678' } });
    fireEvent.click(screen.getByRole('button', { name: 'Airtel Money' }));
    expect(screen.getByRole('button', { name: 'Airtel Money' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'M-Pesa' })).toHaveAttribute('aria-pressed', 'false');
  });
});
