import { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
import { ConfirmationPage } from '@/pages/shared/ConfirmationPage';
import type { PassengerInfo } from '@/types';

const reference = 'TRB-42FA33FB8485';

const passenger: PassengerInfo = {
  id: 'passenger-1',
  category: 'adult',
  fullName: 'Derrick Justine Ndubussa',
  email: 'derrick@example.com',
  phone: '712345678',
  phoneCountryCode: '+255',
  gender: 'male',
  countryOfResidence: 'TZ',
  seatId: '13',
};

function SeedBusBooking({ demo = false }: { demo?: boolean }) {
  const {
    setBookingReference,
    setPaidAmount,
    setDemoTicket,
    setPassengers,
    setSelectedServiceId,
    setBoardingPointId,
    setDropOffPointId,
    setSelectedSeats,
    setSearchParams,
  } = useApp();

  useEffect(() => {
    setSelectedServiceId('bus_001');
    setBoardingPointId('bp_1');
    setDropOffPointId('dp_1');
    setSearchParams({
      mode: 'bus',
      origin: 'Dar es Salaam',
      destination: 'Morogoro',
      date: '2026-10-25',
      adults: 1,
      children: 0,
      infants: 0,
    });
    setPassengers([passenger]);
    setSelectedSeats(['13']);
    if (demo) {
      setDemoTicket({ reference: 'DEMO-12345', amount: 12000 });
    } else {
      setBookingReference(reference);
      setPaidAmount(12000);
    }
  }, [
    setBookingReference,
    setPaidAmount,
    setDemoTicket,
    setPassengers,
    setSelectedServiceId,
    setBoardingPointId,
    setDropOffPointId,
    setSearchParams,
    setSelectedSeats,
    demo,
  ]);

  return null;
}

async function renderConfirmation(type: 'confirmed' | 'demo' | 'none' = 'confirmed') {
  const rootRoute = createRootRoute({ component: Outlet });
  const confirmationRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: 'confirmation',
    component: ConfirmationPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([confirmationRoute]),
    history: createMemoryHistory({ initialEntries: ['/confirmation'] }),
  });
  await router.load();

  return render(
    <I18nProvider>
      <AppProvider>
        {type !== 'none' && <SeedBusBooking demo={type === 'demo'} />}
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>,
  );
}

describe('ConfirmationPage', () => {
  it('prints complete bus ticket details and a QR code for its booking reference', async () => {
    await renderConfirmation();

    expect(await screen.findByText('TRAVELAR')).toBeInTheDocument();
    expect(screen.getByText('travelarway.com')).toBeInTheDocument();
    expect(screen.getByText('BUS TICKET')).toBeInTheDocument();
    expect(screen.getByText(`REF: ${reference}`)).toBeInTheDocument();
    expect(screen.getByText('Kilimanjaro Express')).toBeInTheDocument();
    expect(screen.getByText('Dar es Salaam → Morogoro')).toBeInTheDocument();
    expect(screen.getByText('25/10/26')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('Yutong F12 · T 123 ABC')).toBeInTheDocument();
    expect(screen.getByText('AC Luxury VIP')).toBeInTheDocument();
    expect(screen.getByText('Ubungo Terminal')).toBeInTheDocument();
    expect(screen.getByText('Morogoro Bus Stand')).toBeInTheDocument();
    expect(screen.getByText('Derrick Justine Ndubussa')).toBeInTheDocument();
    expect(screen.getByText('adult · SEAT 13')).toBeInTheDocument();
    expect(screen.getByText('TOTAL PAID')).toBeInTheDocument();
    expect(screen.getByText('TZS 12,000')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByLabelText('Receipt printer')).toHaveAttribute('data-stage', 'complete'),
      { timeout: 3000 },
    );
    expect(screen.getByRole('img', { name: `QR code for ticket reference ${reference}` })).toBeInTheDocument();
  });

  it('moves the ticket from the hidden feed to the printer output', async () => {
    const { container } = await renderConfirmation();
    const printer = screen.getByLabelText('Receipt printer');
    const ticket = container.querySelector('#thermal-ticket');
    expect(ticket).not.toBeNull();
    expect(printer).toHaveAttribute('data-stage', 'processing');
    expect(ticket?.closest('.receipt-paper-hidden')).toBeTruthy();

    await new Promise((resolve) => window.setTimeout(resolve, 650));
    expect(printer).toHaveAttribute('data-stage', 'printing');
    expect(ticket?.closest('.receipt-paper-printing')).toBeTruthy();
  });

  it('prints a clearly marked demo ticket without claiming confirmed payment or boarding validity', async () => {
    await renderConfirmation('demo');

    expect(await screen.findByText('Demo ticket simulation')).toBeInTheDocument();
    expect(screen.getAllByText('DEMO ONLY · NOT A REAL BOOKING · NOT VALID FOR TRAVEL · NO PAYMENT WAS TAKEN').length).toBeGreaterThan(0);
    expect(screen.getByText('REF: DEMO-12345')).toBeInTheDocument();
    expect(screen.getByText('Kilimanjaro Express')).toBeInTheDocument();
    expect(screen.getByText('Dar es Salaam → Morogoro')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('Ubungo Terminal')).toBeInTheDocument();
    expect(screen.getByText('Morogoro Bus Stand')).toBeInTheDocument();
    expect(screen.getByText('Derrick Justine Ndubussa')).toBeInTheDocument();
    expect(screen.getByText('DEMO AMOUNT · NOT PAID')).toBeInTheDocument();
    expect(screen.queryByText('TOTAL PAID')).not.toBeInTheDocument();
    expect(screen.queryByText('Payment confirmed')).not.toBeInTheDocument();
    expect(screen.queryByText('Present this ticket at boarding.')).not.toBeInTheDocument();
    expect(screen.getByText('Demo code only · Not valid for boarding')).toBeInTheDocument();
    await waitFor(
      () => expect(screen.getByLabelText('Receipt printer')).toHaveAttribute('data-stage', 'complete'),
      { timeout: 3000 },
    );
    expect(await screen.findByText('Demo ticket printed')).toBeInTheDocument();
  });

  it('does not render a ticket without confirmed payment data', async () => {
    await renderConfirmation('none');

    expect(screen.getByText('No confirmed booking found.')).toBeInTheDocument();
    expect(screen.queryByText('TRAVELAR')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Print ticket' })).not.toBeInTheDocument();
  });
});
