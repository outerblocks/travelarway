import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from '@/router';
import { CheckCircle2, Download, Home, Loader2, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { getBusTrip } from '@/data/operations';
import { ReceiptPrinter, type ReceiptPrinterStage } from '@/components/shared/ReceiptPrinter';
import { formatCurrency, formatDate } from '@/utils/format';
import { downloadThermalTicket } from '@/utils/ticket-download';

export function ConfirmationPage() {
  const navigate = useNavigate();
  const { bookingState, market, resetBooking } = useApp();
  const { tp } = useI18n();
  const ticketRef = useRef<HTMLDivElement>(null);
  const demoTicket = bookingState.demoTicket;
  const isDemoTicket = demoTicket !== null;
  const bookingReference = bookingState.bookingReference ?? demoTicket?.reference ?? null;
  const ticketAmount = demoTicket?.amount ?? bookingState.paidAmount;
  const [printerStage, setPrinterStage] = useState<ReceiptPrinterStage>('processing');
  const [done, setDone] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    if (!bookingReference) return;

    const printingTimer = window.setTimeout(() => setPrinterStage('printing'), 500);
    const completeTimer = window.setTimeout(() => setPrinterStage('complete'), 2250);
    const doneTimer = window.setTimeout(() => setDone(true), 2700);

    return () => {
      window.clearTimeout(printingTimer);
      window.clearTimeout(completeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [bookingReference]);

  if (!bookingReference || ticketAmount === null) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-body mb-4 text-neutral-500">{tp('ticketNoBooking')}</p>
        <Link to="/" className="btn-primary">{tp('backToHome')}</Link>
      </div>
    );
  }

  const passengers = bookingState.passengers;
  const params = bookingState.searchParams;
  const tripId = params.extras?.tripId ?? bookingState.selectedServiceId;
  const busTrip = bookingState.mode === 'bus'
    ? getBusTrip(tripId)
    : undefined;
  const boardingPoint = busTrip?.boardingPoints.find((point) => point.id === bookingState.boardingPointId);
  const dropOffPoint = busTrip?.dropOffPoints.find((point) => point.id === bookingState.dropOffPointId);
  const ticketRoute = busTrip
    ? `${busTrip.passengerOrigin} → ${busTrip.passengerDestination}`
    : params.origin && params.destination
    ? `${params.origin} → ${params.destination}`
    : params.destination || '';
  const ticketDate = params.date || params.extras?.date || busTrip?.departureDate || '';
  const ticketDeparture = params.extras?.session || '';
  const ticketModeLabel: Record<typeof bookingState.mode, string> = {
    bus: tp('bus').toUpperCase(),
    ferry: tp('ferry').toUpperCase(),
    flights: tp('ticketFlight').toUpperCase(),
    train: tp('ticketTrain').toUpperCase(),
    stays: tp('ticketStay').toUpperCase(),
    experiences: tp('ticketExperience').toUpperCase(),
  };

  // Build ticket fields — these will be rendered in a 2-column grid on the ticket
  const ticketFields = [
    ...(busTrip ? [{ label: tp('ticketOperator'), value: busTrip.operatorName }] : []),
    { label: tp('ticketRoute'), value: ticketRoute },
    { label: tp('ticketDate'), value: ticketDate ? formatTicketDate(ticketDate) : '' },
    { label: bookingState.mode === 'stays' ? tp('ticketCheckIn') : tp('ticketDeparts'), value: busTrip?.departureTime || ticketDeparture },
    ...(busTrip ? [{ label: tp('ticketArrives'), value: busTrip.arrivalTime }] : []),
    ...(busTrip ? [{ label: tp('ticketBus'), value: `${busTrip.busModel} · ${busTrip.registrationNumber}` }] : []),
    ...(busTrip ? [{ label: tp('ticketClass'), value: busTrip.busClass }] : []),
    ...(boardingPoint ? [{ label: tp('ticketBoardAt'), value: boardingPoint.name }] : []),
    ...(dropOffPoint ? [{ label: tp('ticketDropAt'), value: dropOffPoint.name }] : []),
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

  return (
    <div className="bg-background">
      <div className="section-container py-8">
        <div className="mx-auto max-w-2xl">
          <div className="card animate-fade-in mb-6 px-5 py-6 text-center sm:px-6">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              {done ? <CheckCircle2 size={26} /> : <Loader2 size={24} className="animate-spin" />}
            </span>
            <h1 className="text-page font-bold text-neutral-900">
              {isDemoTicket
                ? done ? tp('ticketDemoPrinted') : tp('ticketDemoTitle')
                : done ? tp('ticketBookingConfirmed') : tp('ticketPrinting')}
            </h1>
            <p className="mt-2 text-body text-neutral-500">
              {isDemoTicket ? tp('ticketDemoNotice') : tp('ticketPaymentConfirmed')}
              {' · '}{tp('ticketReference')}{' '}
              <span className="font-bold text-brand-600">{bookingReference}</span>
              {!isDemoTicket && passengers[0]?.email && <> · {tp('ticketSentTo')} {passengers[0].email}</>}
            </p>
          </div>

          <ReceiptPrinter.Root
            stage={printerStage}
            feedMotion="smooth"
            className="receipt-print-region mx-auto mb-6"
          >
            <ReceiptPrinter.Machine className="receipt-printer-machine">
              <ReceiptPrinter.Header>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
                    T
                  </div>
                  <span className="text-meta font-semibold uppercase tracking-wide text-neutral-700">
                    {tp('ticketPrinterName')}
                  </span>
                </div>
                <div aria-hidden="true" className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.55)]" />
                  <span className="h-2 w-2 rounded-full bg-neutral-300" />
                </div>
              </ReceiptPrinter.Header>
              <ReceiptPrinter.Screen className="mx-auto max-w-sm">
                <ReceiptPrinter.Status>
                  {printerStage === 'processing'
                    ? isDemoTicket ? tp('ticketDemoPreparing') : tp('ticketConfirmingPayment')
                    : printerStage === 'printing'
                      ? tp('ticketPrinting')
                      : tp('ticketReady')}
                </ReceiptPrinter.Status>
              </ReceiptPrinter.Screen>
            </ReceiptPrinter.Machine>

            <ReceiptPrinter.Output className="receipt-printer-output">
              <ReceiptPrinter.Paper className="receipt-ticket-paper">
                <div id="thermal-ticket" ref={ticketRef}>
                  {/* ─── Ticket Header ─── */}
                  <div className="border-b border-dashed border-neutral-400 pb-3 text-center">
                    <p className="text-lg font-black tracking-widest">TRAVELAR</p>
                    <p className="text-[10px] tracking-wide">travelarway.com</p>
                    <p className="mt-2 text-xs font-black tracking-wider">{tp('ticketLabel').replace('{mode}', ticketModeLabel[bookingState.mode])}</p>
                    {isDemoTicket && (
                      <p className="mt-2 border-y border-dashed border-amber-600 py-1 text-[9px] font-black text-amber-800">
                        {tp('ticketDemoNotice')}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] font-bold">{tp('ticketReference').toUpperCase()}: {bookingReference}</p>
                  </div>

                  {/* ─── Ticket Fields — 2-column grid layout ─── */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3 text-[10px] leading-tight">
                    {ticketFields.map((field) => {
                      // If the value is long (route, bus info), span full width
                      const isWide = field.label === tp('ticketRoute') || field.label === tp('ticketBus');
                      return (
                        <div key={field.label} className={isWide ? 'col-span-2' : ''}>
                          <span className="text-neutral-500 block">{field.label}</span>
                          <span className="font-bold block">{field.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* ─── Passengers ─── */}
                  {passengers.length > 0 && (
                    <div className="border-t border-dashed border-neutral-400 pt-2 text-[10px] leading-tight">
                      <p className="mb-1 font-bold">{tp('ticketPassengers')}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {passengers.map((passenger, index) => {
                          const seat = passenger.seatId || bookingState.selectedSeats[index];

                          return (
                            <div key={passenger.id} className="min-w-0">
                              <p className="font-bold">{tp('ticketPassenger')} {index + 1}</p>
                              {passenger.fullName && <p className="font-bold uppercase truncate">{passenger.fullName}</p>}
                              <p>
                                {passenger.category.toLowerCase()}
                                {seat ? ` · SEAT ${seat.toUpperCase()}` : ''}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ─── Total ─── */}
                  <div className="border-t border-dashed border-neutral-400 pt-2 mt-2 text-[10px]">
                    <TicketLine
                      label={isDemoTicket ? tp('ticketDemoAmount') : tp('ticketTotalPaid')}
                      value={formatCurrency(ticketAmount, market.currency)}
                      bold
                    />
                  </div>

                  {/* ─── QR Code ─── */}
                  <div className="mt-3 flex flex-col items-center">
                    <QRCodeSVG
                      value={bookingReference}
                      size={104}
                      level="M"
                      includeMargin
                      role="img"
                      aria-label={tp('ticketQrLabel').replace('{reference}', bookingReference)}
                    />
                    <p className="mt-2 text-center text-[10px]">
                      {isDemoTicket ? tp('ticketDemoQrNotice') : tp('ticketPresentAtBoarding')}
                    </p>
                    {!isDemoTicket && <p className="mt-1 text-center text-[10px]">{tp('ticketThankYou')}</p>}
                  </div>
                </div>
              </ReceiptPrinter.Paper>
            </ReceiptPrinter.Output>
          </ReceiptPrinter.Root>

          {done && (
            <>
              <div className="mt-2 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleDownload()}
                  disabled={downloading}
                  aria-busy={downloading}
                  className="btn-primary"
                >
                  {downloading
                    ? <><Loader2 size={18} className="animate-spin" /> {tp('ticketPreparing')}</>
                    : <><Download size={18} /> {tp('ticketDownload')}</>}
                </button>
                <button type="button" onClick={() => window.print()} className="btn-secondary">
                  <Printer size={18} /> {tp('ticketPrint')}
                </button>
                <button type="button" onClick={handleBookAnotherTrip} className="btn-secondary">
                  <Home size={18} /> {tp('ticketBookAnother')}
                </button>
              </div>
              {downloadError && (
                <p className="mt-3 text-center text-sm text-red-700" role="alert">
                  {downloadError}
                </p>
              )}
            </>
          )}

          <p className="text-meta mt-6 text-center text-neutral-500">
            {isDemoTicket ? tp('ticketDemoNotice') : tp('ticketKeepReference')}
          </p>
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

function formatTicketDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return formatDate(value);
  return `${match[3]}/${match[2]}/${match[1].slice(-2)}`;
}
