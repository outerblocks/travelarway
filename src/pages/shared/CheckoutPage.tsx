import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from '@/router';
import { ArrowLeft, CreditCard, Smartphone, Ticket as TicketIcon, Loader2, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { formatMoney } from '@/domain/money';
import { quoteForBooking } from '@/domain/pricing';
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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { bookingState, market, setDemoTicket } = useApp();
  const { tp } = useI18n();
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [mobileProvider, setMobileProvider] = useState(market.mobileMoneyProviders[0] || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle');
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const simulationTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (simulationTimer.current !== null) window.clearTimeout(simulationTimer.current);
  }, []);

  if (!bookingState.selectedServiceId && !bookingState.bookingReference) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-body text-neutral-500 mb-4">{tp('checkoutNoBooking')}</p>
        <Link to="/" className="btn-primary">{tp('backToHome')}</Link>
      </div>
    );
  }

  const quote = quoteForBooking({
    params: bookingState.searchParams,
    passengerCount: bookingState.passengers.length,
    selectedServiceId: bookingState.selectedServiceId,
    selectedClassId: bookingState.selectedClassId,
  });

  const totalAmount = quote?.total ?? null;
  const finalAmount = totalAmount === null ? null : Math.max(0, totalAmount - discount);
  const currency = quote?.currency ?? market.currency;

  const validateCoupon = () => {
    if (!couponCode || totalAmount === null) return;
    setCouponStatus('checking');
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'TRAVELAR10') {
        setDiscount(Math.round(totalAmount * 0.1));
        setCouponStatus('valid');
      } else {
        setDiscount(0);
        setCouponStatus('invalid');
      }
    }, 800);
  };

  const handlePay = () => {
    if (finalAmount === null) {
      setPaymentStatus('unavailable');
      setErrorMsg(tp('checkoutQuoteUnavailable'));
      return;
    }
    if (paymentMethod === 'mobile_money' && !phoneNumber.trim()) {
      setPaymentStatus('failed');
      setErrorMsg(tp('checkoutPhoneRequired'));
      return;
    }

    setPaymentStatus('processing');
    setErrorMsg('');
    simulationTimer.current = window.setTimeout(() => {
      const reference = `DEMO-${Date.now().toString(36).toUpperCase()}`;
      setDemoTicket({ reference, amount: finalAmount });
      setPaymentStatus('demo_complete');
      simulationTimer.current = window.setTimeout(() => {
        navigate('/confirmation');
        simulationTimer.current = null;
      }, 900);
    }, 2300);
  };

  const isProcessing = paymentStatus === 'processing';

  return (
    <div className="bg-background">
      <div className="section-container max-w-3xl py-8">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-3 px-2">
          <ArrowLeft size={18} /> {tp('checkoutBack')}
        </button>

        {/* Progress steps */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {STEP_LABELS.map((step, i) => {
            const isActive = i === 3;
            const isCompleted = i < 3;
            return (
              <div key={step} className="flex items-center gap-2 last:flex-none">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-label font-bold transition-colors ${
                    isActive ? 'bg-brand-600 text-white' : isCompleted ? 'bg-brand-50 text-brand-600' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={15} /> : i + 1}
                </span>
                <span className={`hidden text-meta font-medium sm:inline ${isActive ? 'text-brand-600' : isCompleted ? 'text-neutral-700' : 'text-neutral-400'}`}>
                  {step}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <span aria-hidden="true" className={`ml-1 h-px w-6 rounded sm:w-10 ${isCompleted ? 'bg-brand-200' : 'bg-neutral-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-6">
          <h1 className="text-page font-bold tracking-tight text-neutral-900">{tp('checkoutTitle')}</h1>
          <p className="mt-1 text-body text-neutral-500">{tp('checkoutIntro')}</p>
        </div>

        <div className="card">
          <header className="flex items-center gap-3 rounded-t-xl border-b border-neutral-200 px-5 py-4 sm:px-6">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-label font-bold text-white">4</span>
            <div className="min-w-0">
              <h2 className="text-listing font-bold text-neutral-900">{tp('checkoutPaymentMethod')}</h2>
              <p className="mt-0.5 text-meta text-neutral-500">{tp('checkoutChoosePayment')}</p>
            </div>
          </header>

          <div className="px-5 py-5 sm:px-6">
            <div className="space-y-5">
              <p className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-label text-warning-700" role="note">
                {tp('checkoutDemoNotice')}
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {market.paymentMethods.includes('mobile_money') && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    disabled={isProcessing}
                    aria-pressed={paymentMethod === 'mobile_money'}
                    className={`flex min-h-16 items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      paymentMethod === 'mobile_money'
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <Smartphone size={22} className={paymentMethod === 'mobile_money' ? 'text-brand-600' : 'text-neutral-400'} />
                    <span>
                      <span className="block text-body font-semibold text-neutral-900">{tp('checkoutMobileMoney')}</span>
                      <span className="mt-0.5 block text-meta text-neutral-500">{tp('checkoutPayWithWallet')}</span>
                    </span>
                  </button>
                )}
                {market.paymentMethods.includes('card') && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    disabled={isProcessing}
                    aria-pressed={paymentMethod === 'card'}
                    aria-label={tp('checkoutCardPaymentAria')}
                    className={`flex min-h-16 items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                        : 'border-neutral-200 bg-white hover:border-neutral-400'
                    }`}
                  >
                    <CreditCard size={22} className={paymentMethod === 'card' ? 'text-brand-600' : 'text-neutral-400'} />
                    <span>
                      <span className="block text-body font-semibold text-neutral-900">{tp('checkoutCardPayment')}</span>
                      <span className="mt-0.5 block text-meta text-neutral-500">{tp('checkoutCreditDebit')}</span>
                    </span>
                  </button>
                )}
              </div>

              {paymentMethod === 'mobile_money' && (
                <div className="animate-fade-in">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="mm_provider" className="input-label">{tp('checkoutMobileMoneyProvider')}</label>
                      <select
                        id="mm_provider"
                        className="input-field"
                        value={mobileProvider}
                        onChange={(e) => setMobileProvider(e.target.value)}
                        disabled={isProcessing}
                      >
                        {market.mobileMoneyProviders.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="mm_phone" className="input-label">{tp('checkoutPhoneNumber')}</label>
                      <input
                        id="mm_phone"
                        type="tel"
                        className="input-field"
                        placeholder="712 345 678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={isProcessing}
                        required
                      />
                    </div>
                  </div>
                  <PaymentLogoRow
                    logos={market.mobileMoneyProviders.flatMap((provider) => {
                      const logo = MOBILE_MONEY_LOGOS[provider];
                      return logo ? [logo] : [];
                    })}
                  />
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="animate-fade-in">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-label text-neutral-700">
                    {tp('checkoutCardHostedNotice')}
                  </div>
                  <PaymentLogoRow logos={CARD_LOGOS} />
                </div>
              )}

              {paymentStatus === 'processing' && (
                <PaymentProgressPanel method={paymentMethod === 'card' ? tp('checkoutCardLabel') : mobileProvider} />
              )}
              {paymentStatus === 'failed' && (
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <XCircle size={40} className="text-error-600 mb-3" />
                  <p className="text-body text-error-600 font-medium">{tp('checkoutPaymentFailed')}</p>
                  <p className="text-meta text-neutral-500 mt-1">{errorMsg}</p>
                </div>
              )}
              {paymentStatus === 'unavailable' && (
                <div className="flex flex-col items-center py-6 text-center animate-fade-in" role="status">
                  <Clock size={40} className="mb-3 text-warning-600" />
                  <p className="text-body font-medium text-neutral-900">{errorMsg}</p>
                </div>
              )}
              {paymentStatus === 'demo_complete' && (
                <div className="rounded-lg border border-accent-100 bg-accent-50 p-4 text-center animate-fade-in" role="status">
                  <p className="text-body font-semibold text-accent-700">{tp('checkoutDemoResult')}</p>
                  <p className="mt-1 text-label text-accent-700">{tp('checkoutDemoTicketStarting')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-neutral-200 px-5 py-5 sm:px-6">
            <div className="mb-3">
              <h3 className="text-listing font-bold text-neutral-900">{tp('checkoutCouponTitle')}</h3>
              <p className="mt-0.5 text-meta text-neutral-500">{tp('checkoutPromoHint')}</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-field min-w-0"
                placeholder={tp('checkoutCouponPlaceholder')}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={isProcessing || couponStatus === 'valid'}
              />
              <button
                type="button"
                onClick={validateCoupon}
                className="btn-secondary whitespace-nowrap px-5"
                disabled={isProcessing || couponStatus === 'valid' || !couponCode || totalAmount === null}
              >
                {couponStatus === 'checking' ? <Loader2 size={16} className="animate-spin" /> : tp('checkoutApply')}
              </button>
            </div>
            {couponStatus === 'valid' && (
              <p className="mt-2 text-body text-accent-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={16} /> {tp('checkoutCouponApplied')} {tp('checkoutTenPercentDiscount')}
              </p>
            )}
            {couponStatus === 'invalid' && (
              <p className="mt-2 text-body text-error-600 font-medium flex items-center gap-1">
                <XCircle size={16} /> {tp('checkoutInvalidCoupon')}
              </p>
            )}
          </div>

          <footer className="rounded-b-xl border-t border-neutral-200 bg-neutral-50/70 px-5 py-4 sm:px-6">
            {(paymentStatus === 'idle' || paymentStatus === 'failed' || paymentStatus === 'unavailable') && (
              <button
                type="button"
                onClick={handlePay}
                className="btn-primary w-full py-3.5"
                disabled={finalAmount === null || (paymentMethod === 'mobile_money' && !phoneNumber.trim())}
              >
                <CreditCard size={18} />
                {tp('checkoutSimulateRequest')}
                {finalAmount !== null && <> · {formatMoney(finalAmount, currency)}</>}
              </button>
            )}

            {paymentStatus === 'failed' && (
              <button
                type="button"
                onClick={() => { setPaymentStatus('idle'); setErrorMsg(''); }}
                className="btn-ghost mt-2 w-full"
              >
                {tp('checkoutTryAgain')}
              </button>
            )}

            <div className="mt-4 flex flex-col items-center justify-center gap-2 text-meta text-neutral-400 sm:flex-row sm:gap-5">
              {paymentStatus === 'idle' && (
                <p className="flex items-center gap-1">
                  <TicketIcon size={12} />
                  {tp('checkoutTicketAfterPayment')}
                </p>
              )}
              <p className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-brand-600" />
                {tp('checkoutSecurePayment')}
              </p>
            </div>
          </footer>
        </div>
      </div>
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

function PaymentProgressPanel({ method }: { method: string }) {
  const { tp } = useI18n();

  return (
    <div className="animate-fade-in rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-5">
      <div className="mx-auto flex max-w-xs flex-col items-center">
        <div className="relative mb-4 h-32 w-40" aria-hidden="true">
          <div className="absolute bottom-0 left-1/2 z-10 h-24 w-32 -translate-x-1/2 rounded-xl border border-brand-800 bg-brand-900 p-2.5 shadow-lg">
            <div className="flex h-9 items-center justify-center rounded bg-accent-50 px-2 text-center font-mono text-[9px] font-semibold text-accent-700">
              {tp('checkoutDemoProcessing')}
              <span className="payment-cursor ml-0.5">_</span>
            </div>
            <div className="mx-auto mt-2 grid w-20 grid-cols-3 gap-1">
              {Array.from({ length: 9 }, (_, index) => (
                <span key={index} className="h-1.5 rounded-sm bg-brand-700" />
              ))}
            </div>
          </div>
          <div className="payment-card absolute left-1/2 top-1 z-20 h-16 w-24 -translate-x-1/2 rounded-lg border border-white/20 bg-brand-600 p-2.5 shadow-md">
            <span className="block h-3 w-5 rounded-sm bg-accent" />
            <span className="mt-4 block font-mono text-[8px] tracking-widest text-white/90">••••  ••••</span>
          </div>
        </div>
        <p className="flex items-center gap-2 text-center text-label font-semibold text-neutral-800" role="status" aria-live="polite">
          <Loader2 size={16} className="shrink-0 animate-spin text-brand-600" />
          {tp('checkoutDemoProcessing')}
        </p>
        <p className="mt-1 text-center text-meta text-neutral-500">
          {tp('checkoutDemoFlow').replace('{method}', method)}
        </p>
      </div>
    </div>
  );
}
