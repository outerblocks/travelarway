import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Ticket as TicketIcon, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/format';
import { generateBookingRef } from '@/utils/format';
import type { PaymentStatus } from '@/types';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { bookingState, market, setBookingReference } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [mobileProvider, setMobileProvider] = useState(market.mobileMoneyProviders[0] || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'valid' | 'invalid' | 'checking'>('idle');
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!bookingState.selectedServiceId && !bookingState.bookingReference) {
    return (
      <div className="section-container py-16 text-center">
        <p className="text-body text-neutral-500 mb-4">No booking to check out.</p>
        <Link to="/" className="btn-primary">Back to home</Link>
      </div>
    );
  }

  const totalAmount = bookingState.passengers.reduce((sum, p) => {
    return sum + (p.category === 'adult' ? 12000 : 6000);
  }, 0);

  const finalAmount = Math.max(0, totalAmount - discount);
  const currency = market.currency;

  const validateCoupon = () => {
    if (!couponCode) return;
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
    setPaymentStatus('processing');
    setErrorMsg('');

    setTimeout(() => {
      setPaymentStatus('pending');

      setTimeout(() => {
        const success = Math.random() > 0.15;
        if (success) {
          const ref = generateBookingRef();
          setBookingReference(ref);
          setPaymentStatus('success');
          setTimeout(() => navigate('/confirmation'), 1500);
        } else {
          setPaymentStatus('failed');
          setErrorMsg('Payment was declined. Please try a different payment method.');
        }
      }, 2000);
    }, 1500);
  };

  const isProcessing = paymentStatus === 'processing' || paymentStatus === 'pending';

  return (
    <div className="bg-neutral-50 min-h-screen">
      <div className="section-container py-6">
        <button onClick={() => navigate(-1)} className="btn-ghost mb-4">
          <ArrowLeft size={18} /> Back
        </button>

        <h1 className="text-page font-bold text-neutral-900 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-listing font-bold text-neutral-900 mb-4">Payment Method</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {market.paymentMethods.includes('mobile_money') && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    disabled={isProcessing}
                    className={`flex items-center gap-3 p-4 border rounded-sm transition-colors ${
                      paymentMethod === 'mobile_money'
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <Smartphone size={22} className={paymentMethod === 'mobile_money' ? 'text-brand-600' : 'text-neutral-400'} />
                    <span className="text-body font-medium text-neutral-900">Mobile Money</span>
                  </button>
                )}
                {market.paymentMethods.includes('card') && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    disabled={isProcessing}
                    className={`flex items-center gap-3 p-4 border rounded-sm transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <CreditCard size={22} className={paymentMethod === 'card' ? 'text-brand-600' : 'text-neutral-400'} />
                    <span className="text-body font-medium text-neutral-900">Card Payment</span>
                  </button>
                )}
              </div>

              {paymentMethod === 'mobile_money' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="mm_provider" className="input-label">Mobile Money Provider</label>
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
                    <label htmlFor="mm_phone" className="input-label">Phone Number</label>
                    <input
                      id="mm_phone"
                      type="tel"
                      className="input-field"
                      placeholder="712 345 678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="card_name" className="input-label">Name on Card</label>
                    <input
                      id="card_name"
                      type="text"
                      className="input-field"
                      placeholder="Enter cardholder name"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label htmlFor="card_number" className="input-label">Card Number</label>
                    <input
                      id="card_number"
                      type="text"
                      className="input-field"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      disabled={isProcessing}
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card_expiry" className="input-label">Expiry Date</label>
                      <input
                        id="card_expiry"
                        type="text"
                        className="input-field"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        disabled={isProcessing}
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label htmlFor="card_cvv" className="input-label">CVV</label>
                      <input
                        id="card_cvv"
                        type="text"
                        className="input-field"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        disabled={isProcessing}
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="text-listing font-bold text-neutral-900 mb-4">Coupon or Discount Code</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={isProcessing || couponStatus === 'valid'}
                />
                <button
                  type="button"
                  onClick={validateCoupon}
                  className="btn-secondary whitespace-nowrap"
                  disabled={isProcessing || couponStatus === 'valid' || !couponCode}
                >
                  {couponStatus === 'checking' ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
              {couponStatus === 'valid' && (
                <p className="mt-2 text-body text-accent-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={16} /> Coupon applied: 10% discount
                </p>
              )}
              {couponStatus === 'invalid' && (
                <p className="mt-2 text-body text-error-600 font-medium flex items-center gap-1">
                  <XCircle size={16} /> Invalid coupon code
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="card p-6 sticky top-20">
              <h2 className="text-listing font-bold text-neutral-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Passengers</span>
                  <span className="text-neutral-900 font-medium">{bookingState.passengers.length}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Subtotal</span>
                  <span className="text-neutral-900">{formatCurrency(totalAmount, currency, market.currencySymbol)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-body">
                    <span className="text-accent-600">Discount</span>
                    <span className="text-accent-600">−{formatCurrency(discount, currency, market.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-body">
                  <span className="text-neutral-500">Processing fee</span>
                  <span className="text-neutral-900">{formatCurrency(0, currency, market.currencySymbol)}</span>
                </div>
              </div>
              <div className="border-t border-neutral-200 pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-listing font-bold text-neutral-900">Total</span>
                  <span className="text-listing font-bold text-brand-600">
                    {formatCurrency(finalAmount, currency, market.currencySymbol)}
                  </span>
                </div>
              </div>

              {paymentStatus === 'processing' && (
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <Loader2 size={40} className="text-brand-600 animate-spin mb-3" />
                  <p className="text-body text-neutral-600">Processing payment...</p>
                </div>
              )}
              {paymentStatus === 'pending' && (
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <Clock size={40} className="text-warning-500 mb-3" />
                  <p className="text-body text-neutral-600 font-medium">Awaiting confirmation...</p>
                  <p className="text-meta text-neutral-400 mt-1">Verifying payment with provider</p>
                </div>
              )}
              {paymentStatus === 'failed' && (
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <XCircle size={40} className="text-error-600 mb-3" />
                  <p className="text-body text-error-600 font-medium">Payment failed</p>
                  <p className="text-meta text-neutral-500 mt-1">{errorMsg}</p>
                </div>
              )}
              {paymentStatus === 'success' && (
                <div className="flex flex-col items-center py-6 animate-fade-in">
                  <CheckCircle2 size={40} className="text-accent-600 mb-3" />
                  <p className="text-body text-accent-600 font-medium">Payment confirmed</p>
                  <p className="text-meta text-neutral-500 mt-1">Redirecting to your ticket...</p>
                </div>
              )}

              {(paymentStatus === 'idle' || paymentStatus === 'failed') && (
                <button
                  type="button"
                  onClick={handlePay}
                  className="btn-primary w-full"
                >
                  <CreditCard size={18} />
                  Pay {formatCurrency(finalAmount, currency, market.currencySymbol)}
                </button>
              )}

              {paymentStatus === 'failed' && (
                <button
                  type="button"
                  onClick={() => { setPaymentStatus('idle'); setErrorMsg(''); }}
                  className="btn-ghost w-full mt-2"
                >
                  Try again
                </button>
              )}

              <p className="text-meta text-neutral-400 mt-4 text-center">
                <TicketIcon size={12} className="inline mr-1" />
                Ticket issued only after payment confirmation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
