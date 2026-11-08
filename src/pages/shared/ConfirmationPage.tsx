import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from '@/router';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import type { PublicTranslationKey } from '@/context/I18nContext';
import { formatMoney } from '@/domain/money';
import { formatDate } from '@/utils/format';
import { downloadThermalTicket } from '@/utils/ticket-download';

/** The server's answer for one booking. The page renders this, never its own opinion. */
interface BookingStatus {
  bookingId: string;
  pnr: string;
  status: string;
  totalMinor: number;
  currency: string;
  paymentDueAt: string | null;
  seats: string[];
  verifyToken: string | null;
  /** A collection reached the provider and has not resolved. Survives a reload; `collectionStarted` does not. */
  paymentInFlight?: boolean;
}

const POLL_MS = 8000;

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingState, resetBooking } = useApp();
  const { tp } = useI18n();
  const ticketRef = useRef<HTMLDivElement>(null);
  const active = bookingState.activeBooking;

  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  // Terminal states stop the poll without re-registering the interval on every answer.
  const terminal = useRef<string | null>(null);

  // The booking in context is what checkout created. The status below is what the server
  // says about it now — a payment confirmed after the customer closed the tab must still
  // produce a ticket when they come back to this page.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let timer = 0;

    // A manual refresh must be able to re-read a booking that already looked settled.
    terminal.current = null;

    const load = async () => {
      if (terminal.current && terminal.current !== 'pending_payment') return;
      try {
        // The access token, not the booking id: the id alone proves nothing.
        const response = await fetch(
          `/api/booking-status?token=${encodeURIComponent(active.accessToken)}`,
        );
        if (!response.ok) return;
        const body = (await response.json()) as BookingStatus;
        if (cancelled) return;
        terminal.current = body.status;
        setStatus(body);
      } catch {
        // Leave the last known state: a failed poll is not a failed payment.
      }
    };

    void load();
    timer = window.setInterval(() => void load(), POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [active, reloadToken]);

  const booking = status ?? (active
    ? {
        bookingId: active.bookingId,
        pnr: active.pnr,
        status: active.status,
        totalMinor: active.totalMinor,
        currency: active.currency,
        paymentDueAt: active.paymentDueAt,
        seats: [],
        verifyToken: null,
      }
    : null);

  if (!booking) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-body mb-4 text-neutral-500">{tp('ticketNoBooking')}</p>
        <Link to="/" className="btn-primary">{tp('backToHome')}</Link>
      </div>
    );
  }

  const issued = booking.status === 'issued';
  const pending = booking.status === 'pending_payment';
  // A payment the provider has acknowledged is still a payment. Showing "not started" after
  // a reload invites a second debit for money that is already on its way.
  const inFlight = Boolean(status?.paymentInFlight || active?.collectionStarted);
  const bookingReference = booking.pnr;
  const ticketAmount = booking.totalMinor;
  const ticketCurrency = booking.currency;

  const passengers = bookingState.passengers;
  const params = bookingState.searchParams;
  const extras = params.extras ?? {};
  const ticketRoute = extras.legOrigin && extras.legDestination
    ? `${extras.legOrigin} → ${extras.legDestination}`
    : params.origin && params.destination
    ? `${params.origin} → ${params.destination}`
    : params.destination || '';
  const ticketDate = extras.legDate || params.date || extras.date || '';
  const ticketDeparture = extras.legDeparture || extras.session || '';
  const ticketArrival = extras.legArrival || '';
  const vehicleLabel = extras.busModel && extras.registrationNumber
    ? `${extras.busModel} · ${extras.registrationNumber}`
    : extras.busModel || extras.registrationNumber || '';
  const ticketModeLabel: Record<typeof bookingState.mode, string> = {
    bus: tp('bus').toUpperCase(),
    ferry: tp('ferry').toUpperCase(),
    flights: tp('ticketFlight').toUpperCase(),
    train: tp('ticketTrain').toUpperCase(),
    stays: tp('ticketStay').toUpperCase(),
    experiences: tp('ticketExperience').toUpperCase(),
  };

  // Ticket fields come from the booking the traveller just made, not from a catalogue.
  const ticketFields = [
    ...(extras.operatorName ? [{ label: tp('ticketOperator'), value: extras.operatorName }] : []),
    { label: tp('ticketRoute'), value: ticketRoute },
    { label: tp('ticketDate'), value: ticketDate ? formatTicketDate(ticketDate) : '' },
    { label: bookingState.mode === 'stays' ? tp('ticketCheckIn') : tp('ticketDeparts'), value: ticketDeparture },
    ...(ticketArrival ? [{ label: tp('ticketArrives'), value: ticketArrival }] : []),
    ...(vehicleLabel ? [{ label: tp('ticketBus'), value: vehicleLabel }] : []),
    ...(extras.vesselName ? [{ label: tp('vessel'), value: extras.vesselName }] : []),
    ...(extras.trainName ? [{ label: tp('ticketTrain'), value: extras.trainName }] : []),
    ...(extras.busClass || extras.classLabel
      ? [{ label: tp('ticketClass'), value: extras.busClass || extras.classLabel || '' }]
      : []),
    ...(extras.returnLegOrigin && extras.returnLegDestination ? [
      { label: `${tp('return')} ${tp('ticketRoute')}`, value: `${extras.returnLegOrigin} → ${extras.returnLegDestination}` },
      { label: `${tp('return')} ${tp('ticketDate')}`, value: formatTicketDate(params.returnDate || extras.returnLegDate || '') },
      { label: `${tp('return')} ${tp('ticketDeparts')}`, value: extras.returnLegDeparture || '' },
      { label: `${tp('return')} ${tp('ticketArrives')}`, value: extras.returnLegArrival || '' },
      ...(extras.returnTrainName ? [{ label: `${tp('return')} ${tp('ticketTrain')}`, value: extras.returnTrainName }] : []),
      ...(extras.returnClassLabel ? [{ label: `${tp('return')} ${tp('ticketClass')}`, value: extras.returnClassLabel }] : []),
    ] : []),
    ...(extras.boardingPointName ? [{ label: tp('ticketBoardAt'), value: extras.boardingPointName }] : []),
    ...(extras.dropOffPointName ? [{ label: tp('ticketDropAt'), value: extras.dropOffPointName }] : []),
  ].filter((field) => field.value);

  const handleDownload = async () => {
    if (!ticketRef.current) {
      setDownloadError(tp('ticketDownloadUnavailable'));
      return;
    }

    setDownloading(true);
    setDownloadError('');
    try {
      await downloadThermalTicket(ticketRef.current, bookingReference);
    } catch (error) {
      console.error('Unable to download Travelar ticket.', error);
      setDownloadError(tp('ticketDownloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const handleBookAnotherTrip = () => {
    resetBooking(bookingState.mode);
    navigate('/', { replace: true });
  };

  // Back to the payment form. The booking is reused there, so the customer can correct a
  // number or switch method without paying for a second set of seats.
  const handleRetryPayment = () => navigate('/checkout');

  const statusTitle = issued
    ? tp('ticketBookingConfirmed')
    : pending
      ? tp('confirmAwaitingTitle')
      : tp('confirmExpiredTitle');

  const lead = issued
    ? tp('ticketPresentAtBoarding')
    : pending
      ? inFlight
        ? tp('confirmAwaitingSent')
            .replace('{provider}', 'ClickPesa')
            .replace('{amount}', formatMoney(ticketAmount, ticketCurrency))
        : tp('confirmAwaitingNotSent').replace('{time}', formatDueTime(booking.paymentDueAt))
      : tp('confirmExpiredBody');

  return (
    <div className="bg-background print:bg-white">
      <div className="section-container py-6 sm:py-10 print:py-0">
        <div className="mx-auto max-w-2xl">
          {/*
            Document masthead rather than a decorative status badge. A booking confirmation
            is a record, so it opens like one: wordmark, reference, rule — no icon, no
            centred heading, nothing that could belong to any other product.
          */}
          <header className="flex items-start justify-between gap-6 border-b border-neutral-300 pb-3 print:hidden">
            <p className="font-display text-listing font-bold tracking-[0.18em] text-ink">TRAVELAR</p>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {tp('confirmReferenceLabel')}
              </p>
              <p className="mt-0.5 font-mono text-label font-semibold text-neutral-900">
                {bookingReference}
              </p>
            </div>
          </header>

          <div className="mt-6 print:hidden">
            <h1 className="text-page font-bold tracking-tight text-neutral-900">{statusTitle}</h1>
            <p className="mt-2 max-w-prose text-body text-neutral-600">{lead}</p>
          </div>

          {!issued && (
            <div role="status">
              <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 rounded-md border border-neutral-200 px-4 py-4 sm:grid-cols-2 sm:gap-y-5 sm:px-6">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {tp('checkoutAmountDue')}
                  </dt>
                  <dd className="mt-1 text-listing font-bold tabular-nums text-neutral-900">
                    {formatMoney(ticketAmount, ticketCurrency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {pending ? tp('confirmDeadlineLabel') : tp('statusLabel')}
                  </dt>
                  <dd className="mt-1 text-listing font-semibold tabular-nums text-neutral-900">
                    {pending ? formatDueTime(booking.paymentDueAt) : tp('statusCancelled')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {tp('checkoutPassengers')}
                  </dt>
                  <dd className="mt-1 text-label text-neutral-900">
                    {passengers.length || 1}{' '}
                    {(passengers.length || 1) === 1 ? tp('passengerOne') : tp('passengersMany')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                    {tp('checkoutPay')}
                  </dt>
                  <dd className="mt-1 text-label text-neutral-900">
                    {pending
                      ? inFlight
                        ? tp('confirmStatusAwaiting')
                        : tp('confirmStatusNotStarted')
                      : tp('statusCancelled')}
                  </dd>
                </div>
              </dl>

              {pending && !inFlight && active?.collectionFailure && (
                <section className="mt-4 border-l-2 border-warning-600 pl-4">
                  <p className="text-label font-semibold text-neutral-900">{tp('checkoutStartFailed')}</p>
                  <p className="mt-1 max-w-prose text-body text-neutral-700">
                    {failureExplanation(active.collectionFailure, tp)}
                  </p>
                  {import.meta.env.DEV && active.collectionDetail && (
                    <p className="mt-1 font-mono text-meta break-words text-error-700">
                      {active.collectionDetail}
                    </p>
                  )}
                </section>
              )}

              {pending && (
                <>
                  <p className="mt-4 text-meta text-neutral-500">{tp('confirmNoTicketYet')}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {!inFlight && (
                      <button type="button" onClick={handleRetryPayment} className="btn-primary">
                        {tp('confirmTryPaymentAgain')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReloadToken((value) => value + 1)}
                      className="btn-secondary"
                    >
                      {tp('confirmCheckStatus')}
                    </button>
                    <button type="button" onClick={handleBookAnotherTrip} className="btn-ghost px-2">
                      {tp('ticketBookAnother')}
                    </button>
                  </div>
                </>
              )}

              {!pending && (
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link to="/" className="btn-primary">
                    {tp('backToHome')}
                  </Link>
                  <button type="button" onClick={handleBookAnotherTrip} className="btn-secondary">
                    {tp('ticketBookAnother')}
                  </button>
                </div>
              )}
            </div>
          )}

          {issued && (
          <article id="thermal-ticket" ref={ticketRef} className="card mt-6 mb-6 overflow-hidden">
            <header className="flex items-start justify-between gap-3 border-b-2 border-ink px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
              <div>
                <p className="font-display text-listing font-bold tracking-[0.18em] text-ink">TRAVELAR</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">travelarway.com</p>
              </div>
              <div className="text-right">
                <p className="text-meta font-semibold uppercase tracking-wide text-neutral-500">
                  {tp('ticketLabel').replace('{mode}', ticketModeLabel[bookingState.mode])}
                </p>
                <p className="mt-0.5 font-mono text-body font-bold text-neutral-900">
                  {`${tp('ticketReference').toUpperCase()}: ${bookingReference}`}
                </p>
              </div>
            </header>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 border-b border-neutral-200 px-4 py-3 text-[11px] leading-snug sm:grid-cols-2 sm:gap-y-3 sm:px-6 sm:py-4">
              {ticketFields.map((field) => {
                const isWide = field.label === tp('ticketRoute') ||
                  field.label === `${tp('return')} ${tp('ticketRoute')}` ||
                  field.label === tp('ticketBus');
                return (
                  <div key={field.label} className={isWide ? 'col-span-2' : ''}>
                    <dt className="text-neutral-500">{field.label}</dt>
                    <dd className="font-semibold text-neutral-900">{field.value}</dd>
                  </div>
                );
              })}
            </dl>

            {passengers.length > 0 && (
              <div className="border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  {tp('ticketPassengers')}
                </p>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wide text-neutral-500">
                      <th scope="col" className="pb-1 pr-3 font-medium">#</th>
                      <th scope="col" className="pb-1 font-medium">{tp('ticketPassenger')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passengers.map((passenger, index) => {
                      const seat = passenger.seatId || bookingState.selectedSeats[index];
                      const meta = [
                        passenger.category?.toLowerCase() ?? '',
                        seat ? `SEAT ${seat.toUpperCase()}` : '',
                      ].filter(Boolean).join(' · ');
                      return (
                        <tr key={passenger.id} className="border-t border-neutral-200">
                          <td className="py-1 pr-3 align-top tabular-nums text-neutral-500">{index + 1}</td>
                          <td className="py-1 align-top">
                            <span className="block font-semibold uppercase text-neutral-900">
                              {passenger.fullName || '—'}
                            </span>
                            <span className="text-[10px] text-neutral-500">{meta}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Perforation: the one gold rule on the document. */}
            <div className="flex items-end justify-between gap-4 border-t border-dashed border-neutral-400 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4">
              <div className="min-w-0 text-[10px]">
                <TicketLine
                  label={tp('ticketTotalPaid')}
                  value={formatMoney(ticketAmount, ticketCurrency)}
                  bold
                />
                <p className="mt-2 text-neutral-500">{tp('ticketPresentAtBoarding')}</p>
                <p className="mt-1 text-neutral-500">{tp('ticketThankYou')}</p>
              </div>
              <QRCodeSVG
                // A signed token, not the bare reference: a scannable PNR can be copied
                // from any screenshot and would prove nothing at boarding. The server only
                // mints this for an issued booking.
                value={booking.verifyToken ?? bookingReference}
                size={92}
                level="M"
                includeMargin
                role="img"
                aria-label={tp('ticketQrLabel').replace('{reference}', bookingReference)}
                className="shrink-0"
              />
            </div>
          </article>
          )}

          {issued && (
            <>
              <div className="mt-4 flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  aria-busy={downloading}
                  className="btn-primary"
                >
                  {downloading ? tp('ticketPreparing') : tp('ticketDownload')}
                </button>
                <button type="button" onClick={() => window.print()} className="btn-secondary">
                  {tp('ticketPrint')}
                </button>
                <button type="button" onClick={handleBookAnotherTrip} className="btn-secondary">
                  {tp('ticketBookAnother')}
                </button>
              </div>
              {downloadError && (
                <p className="mt-3 text-center text-sm text-error-700" role="alert">
                  {downloadError}
                </p>
              )}
            </>
          )}

          {issued && (
            <p className="text-meta mt-6 text-center text-neutral-500 print:hidden">
              {tp('ticketKeepReference')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketLine({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-600">{label}</span>
      <strong className={`text-right ${bold ? 'font-black' : 'font-bold'}`}>{value}</strong>
    </div>
  );
}

/** Maps a provider reason code to the sentence the customer should read. */
function failureExplanation(reason: string, tp: (key: PublicTranslationKey) => string): string {
  switch (reason) {
    case 'not_enabled':
      return tp('confirmFailureNotEnabled');
    case 'not_configured':
      return tp('confirmFailureNotConfigured');
    case 'card_requires_usd':
      return tp('confirmFailureCardUsd');
    case 'method_unsupported':
      return tp('confirmFailureMethod');
    case 'phone_required':
      return tp('confirmFailurePhone');
    case 'invalid_phone':
      return tp('confirmFailureInvalidPhone');
    case 'rate_limited':
      return tp('confirmFailureRateLimited');
    default:
      return tp('confirmFailureProvider');
  }
}

function formatTicketDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return formatDate(value);
  return `${match[3]}/${match[2]}/${match[1].slice(-2)}`;
}

/** The payment deadline in the customer's own clock, or a dash when there is none. */
function formatDueTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
