import { Link } from '@/router';
import { useI18n } from '@/context/I18nContext';
import airtelMoney from '@/assets/payments/airtel-money-logo.png';
import crdbBank from '@/assets/payments/bank-crdb.png';
import nbcBank from '@/assets/payments/bank-nbc.png';
import haloPesa from '@/assets/payments/halopesa-logo.png';
import mastercard from '@/assets/payments/mastercard-logo.png';
import mixxByYas from '@/assets/payments/mixx-by-yas-logo.png';
import mpesa from '@/assets/payments/m-pesa-logo.png';
import nmbBank from '@/assets/payments/nmb-bank.png';
import unionPay from '@/assets/payments/unionpay-logo.png';
import visa from '@/assets/payments/visa-logo.png';

const PAYMENT_METHODS = [
  { name: 'Visa', image: visa },
  { name: 'Mastercard', image: mastercard },
  { name: 'UnionPay', image: unionPay },
  { name: 'Airtel Money', image: airtelMoney },
  { name: 'M-Pesa', image: mpesa },
  { name: 'Mixx by Yas', image: mixxByYas },
  { name: 'HaloPesa', image: haloPesa },
  { name: 'NMB Bank', image: nmbBank },
  { name: 'CRDB Bank', image: crdbBank },
  { name: 'NBC Bank', image: nbcBank },
];

export function Footer() {
  const { tp } = useI18n();
  const sections = [
    {
      title: 'Travelar',
      links: [
        { label: tp('aboutTravelar'), to: '/about' },
        { label: tp('contactUs'), to: '/contact' },
        { label: tp('helpCenter'), to: '/help' },
      ],
    },
    {
      title: tp('customerSupport'),
      links: [
        { label: tp('manageBooking'), to: '/manage-booking' },
        { label: tp('helpCenter'), to: '/help' },
        { label: tp('cancellationRefundPolicy'), to: '/cancellation-policy' },
      ],
    },
    {
      title: tp('partners'),
      links: [
        { label: tp('becomeTransportOperator'), to: '/partners' },
        { label: tp('apiEnquiries'), to: '/api-enquiries' },
      ],
    },
    {
      title: tp('legal'),
      links: [
        { label: tp('termsConditions'), to: '/terms' },
        { label: tp('privacyPolicy'), to: '/privacy' },
        { label: tp('cookiePolicy'), to: '/cookies' },
      ],
    },
  ];

  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-900">
      <div className="section-container py-16">
        {/* Link columns */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 text-label font-bold uppercase tracking-wider text-neutral-900">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-body text-neutral-600 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="mt-14 border-t border-neutral-200 pt-8">
          <h3 className="mb-4 text-label font-bold uppercase tracking-wider text-neutral-900">
            {tp('paymentMethodsAvailable')}
          </h3>
          <ul className="flex flex-wrap items-center gap-2" aria-label={tp('paymentMethodsAvailable')}>
            {PAYMENT_METHODS.map(({ name, image }) => (
              <li key={name} className="flex h-10 w-16 items-center justify-center rounded border border-neutral-200 bg-white px-2 py-1.5">
                <img src={image} alt={name} className="max-h-full max-w-full object-contain" loading="lazy" />
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-neutral-200 pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-meta text-neutral-500">
              © {new Date().getFullYear()} Travelar. {tp('operatedBy')}
            </p>
            <div className="flex items-center gap-3 text-meta text-neutral-500">
              <span>{tp('languageEnglish')}</span>
              <span className="text-neutral-600">/</span>
              <span>{tp('languageSwahili')}</span>
              <span className="text-neutral-600">/</span>
              <span>{tp('languageFrench')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
