import { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
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
import { ConfirmationPage } from '@/pages/shared/ConfirmationPage';
import type { PassengerInfo } from '@/types';

const reference = 'TRV-42FA33';
const token = 'payload.signature';

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

type Seeded =
  | { kind: 'bus'; status?: 'issued' | 'pending_payment'; collectionStarted?: boolean; collectionFailure?: string | null }
  | { kind: 'train'; roundTrip?: boolean }
  | { kind: 'none' };

function SeedBooking({ seeded }: { seeded: Exclude<Seeded, { kind: 'none' }> }) {
  const {
    setActiveBooking,
    setPassengers,
    setSelectedServiceId,
    setBoardingPointId,
    setDropOffPointId,
    setSelectedSeats,
    setSearchParams,
  } = useApp();

  useEffect(() => {
    if (seeded.kind === 'train') {
      setSearchParams({
        mode: 'train',
        origin: 'Dar es Salaam',
        destination: 'Dodoma',
        date: '2026-10-25',
        adults: 1,
        children: 0,
        infants: 0,
        returnDate: seeded.roundTrip ? '2026-10-30' : undefined,
        extras: {
          trainId: 'sgr_001',
          classId: 'sgr_001_business',
          operatorName: 'Tanzania Railways Corporation',
          trainName: 'DAR -- DOM | EXPRESS',
          classLabel: 'Business',
          legOrigin: 'Dar es Salaam',
          legDestination: 'Dodoma',
          legDeparture: '06:00',
          legArrival: '09:50',
          legDate: '2026-10-25',
          ...(seeded.roundTrip
            ? {
                tripType: 'return',
                returnTrainId: 'sgr_101',
                returnClassId: 'sgr_101_business',
                returnTrainName: 'DOM -- DAR | EXPRESS',
                returnClassLabel: 'Business',
                returnLegOrigin: 'Dodoma',
                returnLegDestination: 'Dar es Salaam',
                returnLegDeparture: '05:15',
                returnLegArrival: '09:09',
                returnLegDate: '2026-10-30',
              }
            : {}),
        },
      });
      setPassengers([{ ...passenger, seatId: '2-14', idNumber: 'TZ-123456' }]);
      setActiveBooking({
        bookingId: 'b-train',
        pnr: reference,
        totalMinor: seeded.roundTrip ? 161000 : 80500,
        currency: 'TZS',
        status: 'issued',
        paymentDueAt: null,
        collectionStarted: true,
        collectionFailure: null,
        collectionDetail: null,
        accessToken: 'payload.signature',
      });
      return;
    }

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
      extras: {
        operatorName: 'Kilimanjaro Express',
        legOrigin: 'Dar es Salaam',
        legDestination: 'Morogoro',
        legDeparture: '06:00',
        legArrival: '08:30',
        busModel: 'Yutong F12',
        registrationNumber: 'T 123 ABC',
        busClass: 'AC Luxury VIP',
        boardingPointName: 'Ubungo Terminal',
        dropOffPointName: 'Morogoro Bus Stand',
      },
    });
    setPassengers([passenger]);
    setSelectedSeats(['13']);
    setActiveBooking({
      bookingId: 'b-bus',
      pnr: reference,
      totalMinor: 12000,
      currency: 'TZS',
      status: seeded.status ?? 'issued',
      paymentDueAt: seeded.status === 'pending_payment' ? '2026-10-30T21:15:00.000Z' : null,
      collectionStarted: seeded.collectionStarted ?? seeded.status !== 'pending_payment',
      collectionFailure: seeded.status === 'pending_payment' ? seeded.collectionFailure ?? null : null,
      collectionDetail: null,
      accessToken: 'payload.signature',
    });
  }, [
    setActiveBooking,
    setPassengers,
    setSelectedServiceId,
    setBoardingPointId,
    setDropOffPointId,
    setSearchParams,
    setSelectedSeats,
    seeded,
  ]);

  return null;
}

/** The server is the authority on the booking status; these tests stub its answer. */
function stubStatus(status: 'issued' | 'pending_payment', totalMinor = 12000) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          bookingId: 'b-bus',
          pnr: reference,
          status,
          totalMinor,
          currency: 'TZS',
          paymentDueAt: '2026-10-30T21:15:00.000Z',
          seats: ['13'],
          // Only an issued booking carries a signed token from the server.
          verifyToken: status === 'issued' ? token : null,
        }),
      }) as Response,
    ),
  );
}

afterEach(() => vi.restoreAllMocks());

async function renderConfirmation(seeded: Seeded = { kind: 'bus' }) {
  if (seeded.kind === 'bus') stubStatus(seeded.status ?? 'issued', 12000);
  if (seeded.kind === 'train') stubStatus('issued', seeded.roundTrip ? 161000 : 80500);

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
        {seeded.kind !== 'none' && <SeedBooking seeded={seeded} />}
        <RouterProvider router={router} />
      </AppProvider>
    </I18nProvider>,
  );
}

describe('ConfirmationPage', () => {
  it('prints complete bus ticket details and a QR code for its booking reference', async () => {
    await renderConfirmation();

    expect(await screen.findByText('travelarway.com')).toBeInTheDocument();
    // The wordmark appears twice by design: the page masthead and the ticket itself.
    expect(screen.getAllByText('TRAVELAR').length).toBeGreaterThanOrEqual(2);
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
    expect(screen.getByText('TSh 12,000')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: `QR code for ticket reference ${reference}` })).toBeInTheDocument();
  });

  it('renders the ticket as a single printable document', async () => {
    const { container } = await renderConfirmation();
    const ticket = container.querySelector('#thermal-ticket');
    expect(ticket).not.toBeNull();
    // The artefact carries the wordmark, the reference and the QR the boarding check
    // needs; the page around it is print-hidden rather than part of the document.
    expect(ticket?.textContent).toContain('TRAVELAR');
    expect(ticket?.querySelector('svg')).not.toBeNull();
  });

  it('shows an unpaid booking as waiting, with no ticket and no amount paid', async () => {
    await renderConfirmation({ kind: 'bus', status: 'pending_payment', collectionStarted: true });

    expect(await screen.findByText('Waiting for your payment')).toBeInTheDocument();
    expect(screen.getByText(reference)).toBeInTheDocument();
    expect(screen.getByText(/Approve the request on your phone/i)).toBeInTheDocument();
    // The deadline is a labelled field in the summary, not a sentence.
    expect(screen.getByText('Pay by')).toBeInTheDocument();

    // No document may exist for money that has not arrived.
    expect(screen.queryByText('TOTAL PAID')).not.toBeInTheDocument();
    expect(screen.queryByText('BUS TICKET')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download PDF' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /QR code/i })).not.toBeInTheDocument();
    expect(screen.getByText('No ticket has been issued. A ticket exists only once the payment is confirmed.')).toBeInTheDocument();
  });

  it('prints full train station names, selected class, schedule and passenger details', async () => {
    await renderConfirmation({ kind: 'train' });

    expect(await screen.findByText('TRAIN TICKET')).toBeInTheDocument();
    expect(screen.getByText('Tanzania Railways Corporation')).toBeInTheDocument();
    expect(screen.getByText('Dar es Salaam → Dodoma')).toBeInTheDocument();
    expect(screen.getByText('25/10/26')).toBeInTheDocument();
    expect(screen.getByText('06:00')).toBeInTheDocument();
    expect(screen.getByText('09:50')).toBeInTheDocument();
    expect(screen.getByText('DAR -- DOM | EXPRESS')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Derrick Justine Ndubussa')).toBeInTheDocument();
    // Coach and seat are printed exactly as the platform asks for them.
    expect(screen.getByText('adult · SEAT 2-14')).toBeInTheDocument();
    expect(screen.getByText('TSh 80,500')).toBeInTheDocument();
  });

  it('prints both legs and the combined amount for a return train booking', async () => {
    await renderConfirmation({ kind: 'train', roundTrip: true });

    expect(await screen.findByText('Dodoma → Dar es Salaam')).toBeInTheDocument();
    expect(screen.getByText('Return Date')).toBeInTheDocument();
    expect(screen.getByText('30/10/26')).toBeInTheDocument();
    expect(screen.getByText('05:15')).toBeInTheDocument();
    expect(screen.getByText('09:09')).toBeInTheDocument();
    expect(screen.getByText('Return Class')).toBeInTheDocument();
    expect(screen.getAllByText('Business')).toHaveLength(2);
    expect(screen.getByText('TSh 161,000')).toBeInTheDocument();
  });

  it('does not render a ticket without a booking', async () => {
    await renderConfirmation({ kind: 'none' });

    expect(screen.getByText('No confirmed booking found.')).toBeInTheDocument();
    expect(screen.queryByText('TRAVELAR')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Print ticket' })).not.toBeInTheDocument();
  });
});

