import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  const sections = [
    {
      title: 'Travelar',
      links: [
        { label: 'About Travelar', to: '/about' },
        { label: 'Contact Us', to: '/contact' },
        { label: 'Help Center', to: '/help' },
      ],
    },
    {
      title: 'Explore',
      links: [
        { label: 'Bus', to: '/bus' },
        { label: 'Ferry', to: '/ferry' },
        { label: 'Flights', to: '/flights' },
        { label: 'Train', to: '/train' },
        { label: 'Stays', to: '/stays' },
        { label: 'Experiences', to: '/experiences' },
      ],
    },
    {
      title: 'Customer Support',
      links: [
        { label: 'Manage Booking', to: '/manage-booking' },
        { label: 'Help Center', to: '/help' },
        { label: 'Cancellation and Refund Policy', to: '/cancellation-policy' },
      ],
    },
    {
      title: 'Partners',
      links: [
        { label: 'Become a Transport Operator', to: '/partners' },
        { label: 'API and Integration Enquiries', to: '/api-enquiries' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms and Conditions', to: '/terms' },
        { label: 'Privacy Policy', to: '/privacy' },
        { label: 'Cookie Policy', to: '/cookies' },
      ],
    },
  ];

  return (
    <footer className="bg-brand-600 text-white">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-1">
            <Logo variant="light" size="md" />
            <p className="text-label text-white/70 mt-3 max-w-xs">
              Multimodal travel booking for Tanzania and beyond.
            </p>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-label font-bold uppercase tracking-wider text-white/90 mb-3">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-body text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-label text-white/70">
              © {new Date().getFullYear()} Travelar. Operated by OuterBlocks Limited.
            </p>
            <div className="flex items-center gap-4 text-label text-white/70">
              <span>English</span>
              <span className="text-white/40">|</span>
              <span>Swahili</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
