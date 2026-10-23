import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface InfoPageProps {
  title: string;
}

const CONTENT: Record<string, { intro: string; body: string[] }> = {
  'About Travelar': {
    intro: 'Travelar is a multimodal travel booking marketplace and electronic ticketing platform that connects passengers with transport operators, airlines, railway services, ferry operators, accommodation providers, and experiences suppliers.',
    body: [
      'Founded to serve the Tanzanian market with plans to expand across Kenya and other African countries, Travelar offers six booking modes: bus, ferry, flights, train, stays, and experiences.',
      'Travelar is operated by OuterBlocks Limited. The platform supports guest bookings and registered user accounts, with separate systems for operator management (OIMS) and internal company operations (HIMS).',
      'Our mission is to make travel across Africa simpler, more accessible, and more reliable by connecting travellers with trusted operators and suppliers on one unified platform.',
    ],
  },
  'Contact Us': {
    intro: 'We are here to help. Reach out to us for support, partnerships, or general enquiries.',
    body: [
      'For booking support, please use our Help Center or Manage Booking page to retrieve your booking details.',
      'For partnership enquiries, please visit our Partners page or submit an API integration enquiry.',
      'Contact channels will be available as we launch. For now, please use the Help Center for any questions.',
    ],
  },
  'Cancellation and Refund Policy': {
    intro: 'Cancellation and refund policies vary by booking type and supplier.',
    body: [
      'Bus tickets: Cancellation policies are set by each operator. Some tickets may be non-refundable. Please check the fare conditions at the time of booking.',
      'Ferry tickets: Cancellation policies depend on the operator and vessel class. Resident and non-resident fares may have different refund rules.',
      'Flights: Cancellation and refund terms are determined by the airline and fare type. Some fares are non-refundable.',
      'Stays: Cancellation policies are set by each property. Free cancellation may be available up to 48-72 hours before check-in.',
      'Experiences: Full refund may be available up to 12-48 hours before the experience, depending on the supplier.',
      'Train: Cancellation policies follow the railway provider terms.',
    ],
  },
  'Terms and Conditions': {
    intro: 'These terms govern your use of the Travelar platform.',
    body: [
      'Travelar is a booking platform that connects passengers with operators and suppliers. Travelar is not itself a transport operator.',
      'All bookings are subject to the terms and conditions of the relevant operator, airline, accommodation provider, or experience supplier.',
      'Tickets and vouchers are issued only after payment confirmation by the relevant payment service provider.',
      'Travelar reserves the right to refuse or cancel bookings where fraud, abuse, or invalid payment is detected.',
    ],
  },
  'Privacy Policy': {
    intro: 'Your privacy is important to us.',
    body: [
      'Travelar collects personal information necessary for booking processing, including names, contact details, and identification information as required by operators and suppliers.',
      'We do not sell your personal information to third parties.',
      'Payment information is processed securely through our payment service providers. We do not store full card details.',
      'You may request access to, correction of, or deletion of your personal data in accordance with applicable law.',
    ],
  },
  'Cookie Policy': {
    intro: 'Travelar uses cookies to improve your experience.',
    body: [
      'Cookies are small files stored on your device that help us remember your preferences and improve site functionality.',
      'Essential cookies are required for the platform to function correctly. Analytics cookies help us understand how the site is used.',
      'You can manage cookie preferences through your browser settings.',
    ],
  },
  'API and Integration Enquiries': {
    intro: 'Travelar supports integrations with transport operators, airlines, GDS providers, accommodation suppliers, and payment service providers.',
    body: [
      'If you are an operator or supplier interested in integrating with Travelar, please provide details about your service, API capabilities, and commercial requirements.',
      'We support REST API integrations, webhook-based confirmation flows, and real-time inventory synchronization.',
      'Integration enquiries will be reviewed by our partnerships and engineering teams.',
    ],
  },
};

export function InfoPage({ title }: InfoPageProps) {
  const content = CONTENT[title];

  return (
    <div className="section-container py-12">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="btn-ghost mb-6"><ArrowLeft size={16} /> Back to home</Link>
        <h1 className="text-page font-bold text-neutral-900 mb-4">{title}</h1>
        {content ? (
          <>
            <p className="text-body text-neutral-700 mb-6">{content.intro}</p>
            <div className="space-y-4">
              {content.body.map((para, i) => (
                <p key={i} className="text-body text-neutral-600 leading-relaxed">{para}</p>
              ))}
            </div>
          </>
        ) : (
          <p className="text-body text-neutral-500">Content for this page will be available soon.</p>
        )}
        <div className="mt-12 pt-8 border-t border-neutral-200 text-meta text-neutral-400">
          Travelar is operated by OuterBlocks Limited.
        </div>
      </div>
    </div>
  );
}
