import { Link } from 'react-router-dom';
import { HelpCircle, Ticket, CreditCard, Ban, User, ChevronRight } from 'lucide-react';

const HELP_TOPICS = [
  { icon: Ticket, title: 'Managing your booking', desc: 'How to retrieve, view, and modify your booking using your reference number.', link: '/manage-booking' },
  { icon: CreditCard, title: 'Payment methods', desc: 'Information about mobile money, card payments, and supported providers in your market.', link: '/cancellation-policy' },
  { icon: Ban, title: 'Cancellations and refunds', desc: 'Understand cancellation policies and refund timelines for different booking types.', link: '/cancellation-policy' },
  { icon: User, title: 'Account access', desc: 'Sign in, create an account, or manage a booking as a guest.', link: '/signin' },
];

export function HelpPage() {
  return (
    <div className="section-container py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={28} className="text-brand-600" />
          </div>
          <h1 className="text-page font-bold text-neutral-900 mb-2">Help Center</h1>
          <p className="text-body text-neutral-500">Find answers to common questions about your bookings.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HELP_TOPICS.map((topic) => (
            <Link key={topic.title} to={topic.link} className="card p-5 hover:border-brand-300 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-sm flex items-center justify-center flex-shrink-0">
                  <topic.icon size={20} className="text-brand-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-listing font-bold text-neutral-900 mb-1">{topic.title}</h3>
                  <p className="text-body text-neutral-500">{topic.desc}</p>
                </div>
                <ChevronRight size={18} className="text-neutral-300 group-hover:text-brand-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 card p-6 bg-brand-50 border-brand-100">
          <h3 className="text-listing font-bold text-neutral-900 mb-2">Need more help?</h3>
          <p className="text-body text-neutral-600 mb-4">If you can't find what you're looking for, our support team is here to help.</p>
          <Link to="/contact" className="btn-primary">Contact us</Link>
        </div>
      </div>
    </div>
  );
}
