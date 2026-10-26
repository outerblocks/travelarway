import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
  const { setSelectedServiceId, setPassengers, setSearchParams } = useApp();
  useEffect(() => {
    setSelectedServiceId('svc-1');
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
  }, [setSelectedServiceId, setPassengers, setSearchParams, passengers, tripId]);
  return null;
}

function RefProbe() {
  const { bookingState } = useApp();
  return (
    <>
      <div data-testid="ref">{bookingState.bookingReference ?? 'none'}</div>
      <div data-testid="paid-amount">{bookingState.paidAmount ?? 'none'}</div>
      <div data-testid="demo-ref">{bookingState.demoTicket?.reference ?? 'none'}</div>
      <div data-testid="demo-amount">{bookingState.demoTicket?.amount ?? 'none'}</div>
    </>
  );
}

const adultChild = [pax('1', 'adult'), pax('2', 'child')];

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

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CheckoutPage', () => {
  it('shows an empty state when there is no booking', async () => {
    await renderCheckout(null);
    expect(screen.getByText('No booking to check out.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument();
  });

  it('does not invent a price or allow payment when no quote is available', async () => {
    await renderCheckout();
    expect(screen.getByRole('button', { name: 'Simulate payment request' })).toBeDisabled();
    expect(screen.queryByText(/TSh/)).not.toBeInTheDocument();
  });

  it('uses the resolved trip quote for the simulated payment action', async () => {
    // bus_003 fares at 25,000 with children at half price: 25,000 + 12,500.
    await renderCheckout(adultChild, 'bus_003');
    const fmt = (n: number) => `TSh ${n.toLocaleString()}`;
    expect(screen.getByRole('button', { name: new RegExp(`Simulate payment request · ${fmt(37500)}`) })).toBeDisabled();
  });

  it('applies TRAVELAR10 as a 10% discount after 800ms', async () => {
    await renderCheckout(adultChild, 'bus_003');
    fireEvent.change(screen.getByPlaceholderText('Enter coupon code'), { target: { value: 'travelar10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByText(/Coupon applied: 10% discount/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simulate payment request · TSh 33,750/ })).toBeDisabled();
  });

  it('rejects any other coupon code', async () => {
    await renderCheckout(adultChild, 'bus_003');
    fireEvent.change(screen.getByPlaceholderText('Enter coupon code'), { target: { value: 'NOPE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByText('Invalid coupon code')).toBeInTheDocument();
  });

  it('simulates payment then routes to the demo ticket without claiming payment', async () => {
    await renderCheckout(adultChild, 'bus_003');
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '712345678' } });
    fireEvent.click(screen.getByRole('button', { name: /Simulate payment request/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Simulating payment flow (demo only)');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2300);
    });
    expect(screen.getByRole('status')).toHaveTextContent('Demo payment flow complete. No request was sent and no money was charged.');
    expect(screen.getByRole('status')).toHaveTextContent('Preparing your demo ticket for printing…');
    expect(screen.getByTestId('ref').textContent).toBe('none');
    expect(screen.getByTestId('paid-amount').textContent).toBe('none');
    expect(screen.getByTestId('demo-ref').textContent).toMatch(/^DEMO-/);
    expect(screen.getByTestId('demo-amount').textContent).toBe('37500');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(screen.getByText('Demo ticket simulation')).toBeInTheDocument();
    expect(screen.getByLabelText('Receipt printer')).toHaveAttribute('data-stage', 'processing');
    expect(screen.getByText('DEMO AMOUNT · NOT PAID')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2700);
    });
    expect(screen.getByLabelText('Receipt printer')).toHaveAttribute('data-stage', 'complete');
    expect(screen.getByText('Demo ticket printed')).toBeInTheDocument();
  });

  it('does not collect card details and explains the hosted checkout is unavailable', async () => {
    await renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: 'Card Payment' }));
    expect(screen.getByText(/ClickPesa card payments use a hosted checkout/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Card Number')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('CVV')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Visa' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mastercard' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'UnionPay' })).toBeInTheDocument();
  });

  it('only offers payment methods enabled for the market and defaults to mobile money', async () => {
    await renderCheckout();
    expect(screen.getByLabelText('Mobile Money Provider')).toHaveValue('M-Pesa');
    expect(screen.getByRole('button', { name: /Card Payment/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'M-Pesa' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tigo Pesa' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Airtel Money' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'HaloPesa' })).toBeInTheDocument();
  });
});
