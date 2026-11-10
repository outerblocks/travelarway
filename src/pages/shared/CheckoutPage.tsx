import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, Link } from '@/router';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { formatMoney } from '@/domain/money';
import { safePaymentRedirectUrl } from '@/domain/payment-redirect';
import { dialCodeForMarket } from '@/data/locations';
import type { PaymentStatus } from '@/types';
import airtelMoney from '@/assets/payments/airtel-money-logo.png';
import haloPesa from '@/assets/payments/halopesa-logo.png';
import mastercard from '@/assets/payments/mastercard-logo.png';
import mixxByYas from '@/assets/payments/mixx-by-yas-logo.png';
import mpesa from '@/assets/payments/m-pesa-logo.png';
import unionPay from '@/assets/payments/unionpay-logo.png';
import visa from '@/assets/payments/visa-logo.png';

const MOBILE_MONEY_LOGOS: Record<string, { name: string; image: string }> = {
  'M-Pesa': { name: 'M-Pesa', image: mpesa },
  'Tigo Pesa': { name: 'Tigo Pesa', image: mixxByYas },
  'Mixx by Yas': { name: 'Mixx by Yas', image: mixxByYas },
  'Airtel Money': { name: 'Airtel Money', image: airtelMoney },
  Halopesa: { name: 'HaloPesa', image: haloPesa },
};

const CARD_LOGOS = [
  { name: 'Visa', image: visa },
  { name: 'Mastercard', image: mastercard },
  { name: 'UnionPay', image: unionPay },
];

const STEP_LABELS = ['Search', 'Select', 'Details', 'Payment'];

const MODE_LABELS: Record<string, string> = {
  bus: 'Bus',
  ferry: 'Ferry',
  train: 'Train',
  flights: 'Flights',
  flight: 'Flights',
  stays: 'Stays',
  experiences: 'Experiences',
};

/** What the server says this segment costs. The page displays it; it never recomputes it. */
interface ServerQuote {
  currency: string;
  grossMinor: number;
  lines: { kind: 'adult' | 'child'; unitMinor: number; quantity: number; amountMinor: number }[];
}

interface SgrQuoteBody {
  currency?: string;
  total?: number;
  lines?: { label?: string; count?: number; amount?: number }[];
}

/**
 * Folds the SGR quote into the shape the page already renders.
 *
 * A round trip answers with one quote per leg and they are **added**, not chosen between.
 * Pricing only the outward half would put a two-train ticket on a one-train charge, and the
 * shortfall would not be visible anywhere until reconciliation.
 */
function toSgrServerQuote(bodies: (SgrQuoteBody | null)[]): ServerQuote | null {
  const priced = bodies.filter((body): body is SgrQuoteBody => typeof body?.total === 'number');
  if (priced.length === 0 || priced.length !== bodies.length) return null;

  const lines = priced.flatMap((body) =>
    (body.lines ?? []).map((line) => {
      const quantity = Number(line.count ?? 0);
      const unitMinor = Number(line.amount ?? 0);
      return {
        kind: line.label === 'child' ? ('child' as const) : ('adult' as const),
        unitMinor,
        quantity,
        amountMinor: unitMinor * quantity,
      };
    }),
  );

  return {
    currency: priced[0].currency ?? 'TZS',
    grossMinor: priced.reduce((sum, body) => sum + Number(body.total ?? 0), 0),
    lines,
  };
}

/** The two server calls a checkout makes, in order. */
type PayStage = 'creating' | 'requesting';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { bookingState, market, setActiveBooking } = useApp();
  const { tp } = useI18n();
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  // No provider pre-selected. The first in the list is not the customer's network, and a
  // payment request sent to the wrong one is declined on their behalf.
  const [mobileProvider, setMobileProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serverQuote, setServerQuote] = useState<ServerQuote | null>(null);
  const [quoteUnavailable, setQuoteUnavailable] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [stage, setStage] = useState<PayStage>('creating');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const params = bookingState.searchParams;
  const tripId = params.extras?.tripId ?? bookingState.selectedServiceId;
  const fromStopId = bookingState.boardingPointId;
  const toStopId = bookingState.dropOffPointId;
  // SGR carries its trip in a different field, and its price comes from the fare table rather
  // than a per-stop segment. Both modes are priced by the server for the same reason: the
  // number on a checkout is the number we intend to charge.
  const sgrTripId = params.extras?.trainId;
  const sgrClassCode = params.extras?.classId;
  const usesServerQuote = bookingState.mode === 'bus' || bookingState.mode === 'train';
  // Only server-priced modes can take money. Ferry, flights, stays and experiences still show
  // sample (fixture) prices; offering a Pay button beside a number nobody will honour invites
  // a customer to try paying for a trip that does not exist (audit M-001).
  const isPayableMode = usesServerQuote;

  // Bus and train prices come from the server for the exact thing being bought. The old path
  // priced the route's origin from a fixture module: for a trip that only exists in the
  // database it returned nothing at all, which is why the pay button could not be pressed.
  useEffect(() => {
    if (!usesServerQuote) return;

    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const legId = bookingState.mode === 'train' ? sgrTripId : tripId;

    // A trip is a database row with a UUID. Anything else (a stale selection, a fixture id)
    // has no price to fetch, and pretending to wait for one leaves the button spinning.
    if (
      !legId ||
      !UUID.test(legId) ||
      (bookingState.mode === 'bus' && (!fromStopId || !toStopId)) ||
      (bookingState.mode === 'train' && !sgrClassCode)
    ) {
      setServerQuote(null);
      setQuoteUnavailable(true);
      return;
    }

    const controller = new AbortController();
    const search = new URLSearchParams({
      adults: String(params.adults),
      children: String(params.children),
    });

    if (bookingState.mode === 'train') {
      // Every leg the traveller selected, priced by the server. A missing return quote fails
      // the whole checkout rather than falling back to the outbound price alone.
      const legs = [{ tripId: legId, classCode: sgrClassCode, fromSeq: params.extras?.fromSeq ?? '0', toSeq: params.extras?.toSeq ?? '1' }];
      const retTripId = params.extras?.returnTrainId;
      const retClass = params.extras?.returnClassId;
      if (retTripId && retClass) {
        legs.push({
          tripId: retTripId,
          classCode: retClass,
          fromSeq: params.extras?.returnFromSeq ?? '0',
          toSeq: params.extras?.returnToSeq ?? '1',
        });
      }

      Promise.all(
        legs.map((leg) =>
          fetch(
            `/api/sgr/trips/${leg.tripId}/quote?class=${leg.classCode}&from=${leg.fromSeq}&to=${leg.toSeq}&${search.toString()}`,
            {
              signal: controller.signal,
              cache: 'no-store',
            },
          )
            .then(async (response) => (response.ok ? ((await response.json()) as SgrQuoteBody) : null))
            .catch((error: unknown) => {
              if (error instanceof Error && error.name === 'AbortError') throw error;
              return null;
            }),
        ),
      )
        .then((bodies) => {
          const quote = toSgrServerQuote(bodies);
          setServerQuote(quote);
          setQuoteUnavailable(quote === null);
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'AbortError') return;
          setServerQuote(null);
          setQuoteUnavailable(true);
        });

      return () => controller.abort();
    }

    fetch(`/api/trip-detail?id=${legId}&from=${fromStopId}&to=${toStopId}&${search.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as Record<string, unknown>;
      })
      .then((body) => {
        const quote = (body as { data?: { quote?: ServerQuote } })?.data?.quote ?? null;
        setServerQuote(quote);
        setQuoteUnavailable(quote === null);
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setServerQuote(null);
        setQuoteUnavailable(true);
      });

    return () => controller.abort();
  }, [usesServerQuote, bookingState.mode, tripId, sgrTripId, sgrClassCode, params.extras, fromStopId, toStopId, params.adults, params.children]);

  // Unmodelled modes have no catalogue price. Bus and train wait for the server quote.
  const clientQuote = null;

  // A booking is in place once the traveller has chosen something and given details.
  const hasBooking =
    bookingState.selectedServiceId !== null ||
    bookingState.passengers.length > 0 ||
    bookingState.activeBooking !== null;

  const totalAmount = usesServerQuote ? serverQuote?.grossMinor ?? null : clientQuote?.total ?? null;

  if (!hasBooking && totalAmount === null) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-body mb-4 text-neutral-500">{tp('checkoutNoBooking')}</p>
        <Link to="/" className="btn-primary">{tp('backToHome')}</Link>
      </div>
    );
  }

  const currency =
    (usesServerQuote ? serverQuote?.currency : clientQuote?.currency) ?? market.currency;
  const isProcessing = paymentStatus === 'processing';
  // Waiting for the server's price is a different state from "no price exists". Showing a
  // dead button in both made the first case look broken.
  const isQuoteLoading = bookingState.mode === 'bus' && totalAmount === null && !quoteUnavailable;
  const passengerCount = bookingState.passengers.length || 1;
  const modeLabel = MODE_LABELS[bookingState.mode] ?? bookingState.mode;

  /** Turns a provider reason code into the sentence a customer can act on. */
  const reasonCopy = (failure: string | null): string => {
    switch (failure) {
      case 'not_enabled':
        return tp('confirmFailureNotEnabled');
      case 'not_configured':
        return tp('confirmFailureNotConfigured');
      case 'invalid_phone':
        return tp('confirmFailureInvalidPhone');
      case 'phone_required':
        return tp('confirmFailurePhone');
      case 'card_requires_usd':
        return tp('confirmFailureCardUsd');
      case 'method_unsupported':
        return tp('confirmFailureMethod');
      case 'rate_limited':
        return tp('confirmFailureRateLimited');
      default:
        return tp('confirmFailureProvider');
    }
  };

  const handlePay = () => {
    if (!isPayableMode) return;
    if (totalAmount === null) {
      setPaymentStatus('unavailable');
      setErrorMsg(tp('checkoutQuoteUnavailable'));
      return;
    }
    if (paymentMethod === 'mobile_money' && !phoneNumber.trim()) {
      setPaymentStatus('failed');
      setErrorMsg(tp('checkoutPhoneRequired'));
      return;
    }

    clearTimers();
    setPaymentStatus('processing');
    setStage('creating');
    setErrorMsg('');
    setErrorDetail(null);

    void (async () => {
      // Two server calls, both real: create the booking, then ask the provider to collect.
      // Nothing here decides that a payment happened — only a signed provider callback can
      // do that, and it arrives at the server, not at this page.
      const tripId = bookingState.searchParams.extras?.tripId ?? bookingState.selectedServiceId;
      const buyer = bookingState.passengers[0];
      const seats = bookingState.selectedSeats;
      const fromStopId = bookingState.boardingPointId;
      const toStopId = bookingState.dropOffPointId;
      const adults = bookingState.searchParams.adults;
      const children = bookingState.searchParams.children;

      // The segment identifies what is being priced. Without it the server cannot quote
      // the journey, so we refuse rather than send an amount we made up.
      if (!tripId || seats.length === 0 || !fromStopId || !toStopId) {
        setPaymentStatus('unavailable');
        setErrorMsg(tp('checkoutQuoteUnavailable'));
        return;
      }

      try {
        // A retry must not book again: the booking and its holds already exist, and a second
        // commit would fail on seats that this browser now owns. Only create one when there
        // is not already a pending booking for this checkout.
        const existing = bookingState.activeBooking;
        let booking: {
          bookingId: string;
          pnr: string;
          totalMinor: number;
          currency: string;
          status: string;
          paymentDueAt: string;
          accessToken: string;
        };

        if (existing && existing.status === 'pending_payment') {
          booking = {
            bookingId: existing.bookingId,
            pnr: existing.pnr,
            totalMinor: existing.totalMinor,
            currency: existing.currency,
            status: existing.status,
            paymentDueAt: existing.paymentDueAt ?? '',
            accessToken: existing.accessToken,
          };
        } else {
          const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              tripId,
              fromStopId,
              toStopId,
              seats,
              adults,
              children,
              customerName: buyer?.fullName ?? '',
              customerEmail: buyer?.email ?? '',
              customerPhone: buyer ? `${buyer.phoneCountryCode} ${buyer.phone}` : '',
              passengers: bookingState.passengers.map((passenger, index) => ({
                fullName: passenger.fullName,
                category: passenger.category,
                seatNo: passenger.seatId ?? seats[index] ?? '',
              })),
            }),
          });

          if (!response.ok) {
            // Show the server's reason code rather than a slogan.
            const failure = (await response.json().catch(() => null)) as {
              error?: string;
              reason?: string;
            } | null;
            const code = failure?.reason ? `${failure.error}: ${failure.reason}` : failure?.error ?? `HTTP ${response.status}`;
            setPaymentStatus('failed');
            setErrorMsg(code);
            return;
          }

          booking = (await response.json()) as typeof booking;
        }

        setStage('requesting');

        // A failure here is not a failed booking: the seats stay held until the deadline
        // and the confirmation page says plainly that no money has been taken.
        let collectionStarted = false;
        let collectionFailure: string | null = null;
        let collectionDetail: string | null = null;
        let redirectUrl: string | null = null;
        try {
          const started = await fetch('/api/payments/start', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              bookingId: booking.bookingId,
              method: paymentMethod,
              phoneNumber: phoneNumber.trim(),
              accessToken: booking.accessToken,
            }),
          });
          const attempt = (await started.json()) as {
            collectionStarted?: boolean;
            failure?: string | null;
            detail?: string | null;
            redirectUrl?: string | null;
          };
          collectionStarted = started.ok && attempt.collectionStarted === true;
          collectionFailure = started.ok ? null : attempt.failure ?? 'provider_error';
          collectionDetail = started.ok ? null : attempt.detail ?? null;
          redirectUrl = started.ok ? attempt.redirectUrl ?? null : null;

          if (!started.ok) {
            // The single most useful line when a payment will not start.
            console.warn('[checkout] payment start failed', {
              status: started.status,
              failure: collectionFailure,
              detail: collectionDetail,
            });
          }
        } catch {
          collectionFailure = 'provider_error';
        }

        setActiveBooking({
          bookingId: booking.bookingId,
          pnr: booking.pnr,
          totalMinor: booking.totalMinor,
          currency: booking.currency,
          status: booking.status,
          paymentDueAt: booking.paymentDueAt,
          collectionStarted,
          collectionFailure,
          collectionDetail,
          accessToken: booking.accessToken,
        });

        // Card payments continue on the provider's hosted page. Leaving the site is the
        // only way to enter a card number without this origin entering PCI scope.
        const providerCheckout = safePaymentRedirectUrl(redirectUrl);
        if (providerCheckout) {
          window.location.assign(providerCheckout);
          return;
        }

        if (!collectionStarted) {
          // Stay here. The booking and its seats are real, but sending the customer to a
          // confirmation page that can only say "waiting" hides the one thing they need:
          // what the provider actually objected to, and the chance to fix it and retry.
          setPaymentStatus('failed');
          setErrorMsg(reasonCopy(collectionFailure));
          setErrorDetail(collectionDetail);
          return;
        }

        setPaymentStatus('pending');
        navigate('/confirmation');
      } catch (error) {
        setPaymentStatus('failed');
        setErrorMsg(error instanceof Error ? error.message : tp('bookingServiceTryAgain'));
      }
    })();
  };

  const retry = () => {
    setPaymentStatus('idle');
    setStage('creating');
    setErrorMsg('');
    setErrorDetail(null);
  };

  return (
    <div className="bg-background">
      <div className="section-container max-w-5xl py-6 sm:py-8">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4 px-2">
          ← {tp('checkoutBack')}
        </button>

        {/* Progress steps */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {STEP_LABELS.map((step, i) => {
            const isActive = i === 3;
            const isCompleted = i < 3;
            return (
              <div key={step} className="flex items-center gap-2 last:flex-none">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-label font-bold transition-colors ${
                    isActive ? 'bg-ink text-white' : isCompleted ? 'bg-brand-50 text-brand-600' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {isCompleted ? '✓' : i + 1}
                </span>
                <span className={`hidden text-meta font-medium sm:inline ${isActive ? 'text-ink' : isCompleted ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  {step}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <span aria-hidden="true" className={`ml-1 h-px w-6 rounded sm:w-10 ${isCompleted ? 'bg-brand-200' : 'bg-neutral-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-page font-bold tracking-tight text-neutral-900">{tp('checkoutTitle')}</h1>
          <p className="mt-1 text-body text-neutral-500">{tp('checkoutChoosePayment')}</p>
        </div>

        <div className="mx-auto max-w-2xl">
          {/* Payment column */}
          <div className="space-y-4">
            {paymentStatus !== 'idle' && (
              <PaymentStatusStrip
                status={paymentStatus}
                stage={stage}
                method={paymentMethod === 'card' ? tp('checkoutCardLabel') : mobileProvider}
                message={errorMsg}
                detail={errorDetail}
              />
            )}

            <div className="card">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <fieldset disabled={isProcessing}>
                  <legend className="text-listing font-bold text-neutral-900">{tp('checkoutPaymentMethod')}</legend>
                  {market.paymentMethods.length === 0 ? (
                    <p className="mt-3 text-body text-neutral-600">{tp('checkoutPosNotLicensed')}</p>
                  ) : null}
                  <div className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
                    {market.paymentMethods.includes('mobile_money') && (
                      <MethodOption
                        id="method_mobile_money"
                        name="payment_method"
                        checked={paymentMethod === 'mobile_money'}
                        onSelect={() => setPaymentMethod('mobile_money')}
                        icon={<span className="text-body font-bold">M</span>}
                        title={tp('checkoutMobileMoney')}
                        hint={tp('checkoutPayWithWallet')}
                      />
                    )}
                    {market.paymentMethods.includes('card') && (
                      <MethodOption
                        id="method_card"
                        name="payment_method"
                        checked={paymentMethod === 'card'}
                        onSelect={() => setPaymentMethod('card')}
                        icon={<span className="text-body font-bold">C</span>}
                        title={tp('checkoutCardPayment')}
                        hint={tp('checkoutCreditDebit')}
                      />
                    )}
                  </div>
                </fieldset>

                {market.paymentMethods.includes('mobile_money') && paymentMethod === 'mobile_money' && (
                  <div className="mt-6">
                    <span className="input-label">{tp('checkoutMobileMoneyProvider')}</span>
                    {!mobileProvider && (
                      <p className="mt-1 text-meta text-neutral-500">{tp('chooseProviderFirst')}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {market.mobileMoneyProviders.map((provider) => {
                        const isSelected = mobileProvider === provider;
                        const logo = MOBILE_MONEY_LOGOS[provider];
                        return (
                          <button
                            key={provider}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isProcessing}
                            onClick={() => setMobileProvider(provider)}
                            className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-label font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                              isSelected
                                ? 'border-ink bg-brand-50 text-ink'
                                : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                            }`}
                          >
                            {logo && <img src={logo.image} alt="" aria-hidden="true" className="h-5 w-auto object-contain" />}
                            {provider}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5">
                      <label htmlFor="mm_phone" className="input-label">{tp('checkoutPhoneNumber')}</label>
                      <div className="mt-1 flex items-stretch">
                        <span className="flex items-center rounded-l-lg border border-r-0 border-neutral-200 bg-neutral-50 px-3 text-body font-medium text-neutral-600">
                          {dialCodeForMarket(market.countryCode)}
                        </span>
                        <input
                          id="mm_phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel-national"
                          className="input-field min-w-0 rounded-l-none"
                          placeholder="712 345 678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={isProcessing}
                          required
                          aria-describedby="mm_phone_hint"
                        />
                      </div>
                      <p id="mm_phone_hint" className="mt-2 text-meta text-neutral-500">
                        {tp('checkoutPhoneHint')}
                      </p>
                    </div>
                  </div>
                )}

                {market.paymentMethods.includes('card') && paymentMethod === 'card' && (
                  <div className="mt-6">
                    <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-label text-neutral-700">
                      {tp('checkoutCardHostedNotice')}
                    </p>
                    <PaymentLogoRow logos={CARD_LOGOS} />
                  </div>
                )}
              </div>

              {/* The amount and the one action, directly under the form. */}
              <div className="border-t border-neutral-200 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-label text-neutral-500">{tp('checkoutAmountDue')}</span>
                  <span className="font-display text-listing font-bold tabular-nums text-neutral-900">
                    {totalAmount === null ? '—' : formatMoney(totalAmount, currency)}
                  </span>
                </div>
                <p className="mt-1 text-meta text-neutral-500">
                  {modeLabel} · {passengerCount}{' '}
                  {passengerCount === 1 ? tp('passengerOne') : tp('passengersMany')}
                </p>

                {serverQuote && serverQuote.lines.length > 0 && (
                  <dl className="mt-2 space-y-0.5 text-meta text-neutral-500">
                    {serverQuote.lines.map((line) => (
                      <div key={line.kind} className="flex justify-between gap-4">
                        <dt>
                          {line.kind === 'adult' ? tp('adults') : tp('children')} × {line.quantity}
                        </dt>
                        <dd className="tabular-nums">{formatMoney(line.amountMinor, currency)}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {bookingState.mode === 'bus' && quoteUnavailable && (
                  <p className="mt-3 text-meta text-warning-700" role="alert">
                    {tp('checkoutQuoteUnavailable')}
                  </p>
                )}

                <div className="mt-4">
                  {isQuoteLoading && (
                    <button type="button" className="btn-primary w-full py-3.5" disabled aria-busy="true">
                      <Loader2 size={18} className="animate-spin" />
                      {tp('checkoutQuoteLoading')}
                    </button>
                  )}

                  {!isQuoteLoading &&
                    (paymentStatus === 'idle' || paymentStatus === 'failed' || paymentStatus === 'unavailable') && (
                    <button
                      type="button"
                      onClick={handlePay}
                      className="btn-primary w-full py-3.5"
                      disabled={
                        !isPayableMode ||
                        totalAmount === null ||
                        market.paymentMethods.length === 0 ||
                        (paymentMethod === 'mobile_money' && (!mobileProvider || !phoneNumber.trim()))
                      }
                    >
                      {!isPayableMode || market.paymentMethods.length === 0
                        ? tp('comingSoon')
                        : tp('checkoutPayAmount').replace(
                        '{amount}',
                        totalAmount === null ? '' : formatMoney(totalAmount, currency),
                      )}
                    </button>
                  )}

                  {isProcessing && (
                    <button type="button" className="btn-primary w-full py-3.5" disabled>
                      <Loader2 size={18} className="animate-spin" />
                      {tp('checkoutStateProcessing')}
                    </button>
                  )}

                  {paymentStatus === 'failed' && (
                    <button type="button" onClick={retry} className="btn-secondary mt-2 w-full py-3">
                      {tp('checkoutTryAgain')}
                    </button>
                  )}
                </div>

                <p className="mt-3 flex items-start gap-1.5 text-meta text-neutral-500">
                  
                  {tp('checkoutSecurePayment')}
                </p>
                {paymentStatus === 'idle' && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-meta text-neutral-500">
                    
                    {tp('checkoutTicketAfterPayment')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodOption({
  id,
  name,
  checked,
  onSelect,
  icon,
  title,
  hint,
}: {
  id: string;
  name: string;
  checked: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-16 cursor-pointer items-center gap-3 py-3 transition-colors focus-within:bg-brand-50/60 ${
        checked ? 'text-ink' : 'text-neutral-700'
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 shrink-0 accent-[var(--ink)]"
      />
      <span className={checked ? 'text-ink' : 'text-neutral-400'}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-body font-semibold text-neutral-900">{title}</span>
        <span className="mt-0.5 block text-meta text-neutral-500">{hint}</span>
      </span>
    </label>
  );
}

function PaymentStatusStrip({
  status,
  stage,
  method,
  message,
  detail,
}: {
  status: PaymentStatus;
  stage: PayStage;
  method: string;
  message?: string;
  detail?: string | null;
}) {
  const { tp } = useI18n();

  if (status === 'failed' || status === 'unavailable') {
    return (
      <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-3" role="alert">
        <p className="flex items-center gap-2 text-label font-semibold text-error-700">
          <XCircle size={16} />
          {status === 'failed' ? tp('checkoutStartFailed') : tp('checkoutQuoteUnavailable')}
        </p>
        {message && <p className="mt-1 pl-6 text-label text-error-700">{message}</p>}
        {detail && (
          <p className="mt-1 pl-6 font-mono text-meta break-words text-neutral-700">
            {detail}
          </p>
        )}
      </div>
    );
  }

  // Only the work this page actually performs. "Waiting for approval" is not a step here:
  // that happens between the customer and their handset, and inventing a tick for it
  // would be the same lie as inventing a payment.
  const steps: { key: PayStage; label: string }[] = [
    { key: 'creating', label: tp('checkoutStatusSending') },
    { key: 'requesting', label: tp('checkoutStatusAwaiting') },
  ];
  const currentIndex = stage === 'creating' ? 0 : 1;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3" role="status" aria-live="polite">
      <p className="flex items-center gap-2 text-label font-medium text-neutral-900">
        {status === 'pending' ? (
          <CheckCircle2 size={15} className="text-success-600" />
        ) : (
          <Loader2 size={15} className="animate-spin text-ink" />
        )}
        {status === 'pending' ? tp('bookingCreatedNotice') : method}
      </p>
      <ol className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex && status !== 'pending';
          return (
            <li
              key={step.key}
              className={`flex items-center gap-1.5 ${done || status === 'pending' ? 'text-success-700' : active ? 'font-semibold text-ink' : 'text-neutral-400'}`}
            >
              {done || status === 'pending' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
              {step.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PaymentLogoRow({ logos }: { logos: { name: string; image: string }[] }) {
  return (
    <ul className="mt-5 flex flex-wrap items-center gap-3" aria-label="Available payment brands">
      {logos.map(({ name, image }) => (
        <li
          key={name}
          className="flex h-11 min-w-16 items-center justify-center rounded-md border border-neutral-200 bg-white px-3 py-2"
        >
          <img src={image} alt={name} className="max-h-7 max-w-20 object-contain" />
        </li>
      ))}
    </ul>
  );
}
