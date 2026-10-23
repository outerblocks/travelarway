import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { CheckoutPage } from '@/pages/shared/CheckoutPage';
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

function Seed({ passengers }: { passengers: PassengerInfo[] }) {
  const { setSelectedServiceId, setPassengers } = useApp();
  useEffect(() => {
    setSelectedServiceId('svc-1');
    setPassengers(passengers);
  }, [setSelectedServiceId, setPassengers, passengers]);
  return null;
}

function RefProbe() {
  const { bookingState } = useApp();
  return <div data-testid="ref">{bookingState.bookingReference ?? 'none'}</div>;
}

const adultChild = [pax('1', 'adult'), pax('2', 'child')];

function renderCheckout(passengers: PassengerInfo[] | null = adultChild) {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <AppProvider>
        {passengers && <Seed passengers={passengers} />}
        <RefProbe />
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/confirmation" element={<div>CONFIRMATION PAGE</div>} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Characterization of CURRENT behaviour, including the known F1 quirk:
// checkout prices passengers at a flat 12,000 (adult) / 6,000 (child) and
// ignores the fare shown on the review page.
describe('CheckoutPage (current behaviour)', () => {
  it('shows an empty state when there is no booking', () => {
    renderCheckout(null);
    expect(screen.getByText('No booking to check out.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument();
  });

  it('prices a flat 12,000 per adult and 6,000 per child (F1 quirk)', () => {
    renderCheckout();
    const fmt = (n: number) => `TSh ${n.toLocaleString()}`;
    expect(screen.getByText('Passengers').nextSibling).toHaveTextContent('2');
    expect(screen.getByText('Subtotal').nextSibling).toHaveTextContent(fmt(18000));
    expect(screen.getByRole('button', { name: new RegExp(`Pay ${fmt(18000)}`) })).toBeInTheDocument();
  });

  it('applies TRAVELAR10 as a 10% discount after 800ms', async () => {
    renderCheckout();
    fireEvent.change(screen.getByPlaceholderText('Enter coupon code'), { target: { value: 'travelar10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByText(/Coupon applied: 10% discount/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: new RegExp(`Pay TSh ${(16200).toLocaleString()}`) })).toBeInTheDocument();
  });

  it('rejects any other coupon code', async () => {
    renderCheckout();
    fireEvent.change(screen.getByPlaceholderText('Enter coupon code'), { target: { value: 'NOPE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });
    expect(screen.getByText('Invalid coupon code')).toBeInTheDocument();
  });

  it('payment success: processing -> pending -> success -> confirmation with a TRV reference', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    expect(screen.getByText('Processing payment...')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.getByText('Awaiting confirmation...')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(screen.getByText('Payment confirmed')).toBeInTheDocument();
    expect(screen.getByTestId('ref').textContent).toMatch(/^TRV-\d{6}$/);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(screen.getByText('CONFIRMATION PAGE')).toBeInTheDocument();
  });

  it('payment failure: shows the decline message and allows retry', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    renderCheckout();
    fireEvent.click(screen.getByRole('button', { name: /^Pay/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });
    expect(screen.getByText('Payment failed')).toBeInTheDocument();
    expect(screen.getByText('Payment was declined. Please try a different payment method.')).toBeInTheDocument();
    expect(screen.getByTestId('ref').textContent).toBe('none');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByText('Payment failed')).not.toBeInTheDocument();
  });

  it('only offers payment methods enabled for the market and defaults to mobile money', () => {
    renderCheckout();
    expect(screen.getByLabelText('Mobile Money Provider')).toHaveValue('M-Pesa');
    expect(screen.getByRole('button', { name: /Card Payment/ })).toBeInTheDocument();
  });
});
