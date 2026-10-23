import { Handshake, Bus, Ship, Building2, Compass, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PartnersPage() {
  return (
    <div className="section-container py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Handshake size={28} className="text-brand-600" />
          </div>
          <h1 className="text-page font-bold text-neutral-900 mb-3">Become a Travelar Partner</h1>
          <p className="text-body text-neutral-500 max-w-2xl mx-auto">
            Join Travelar to reach travellers across Tanzania and beyond. We partner with transport operators, accommodation providers, and experience suppliers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="card p-6">
            <div className="w-12 h-12 bg-brand-50 rounded-sm flex items-center justify-center mb-4">
              <Bus size={24} className="text-brand-600" />
            </div>
            <h3 className="text-listing font-bold text-neutral-900 mb-2">Transport Operators</h3>
            <p className="text-body text-neutral-500 mb-4">Bus and ferry operators can manage fleets, routes, schedules, fares, and manifests through our Operator Management System.</p>
            <ul className="space-y-2 text-body text-neutral-600">
              <li>• Configure routes, stops, and segment-based fares</li>
              <li>• Manage seat maps and vehicle configurations</li>
              <li>• View booking manifests and OTC sales</li>
              <li>• Ferry operators manage vessels, classes, and capacities</li>
            </ul>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-brand-50 rounded-sm flex items-center justify-center mb-4">
              <Building2 size={24} className="text-brand-600" />
            </div>
            <h3 className="text-listing font-bold text-neutral-900 mb-2">Accommodation Providers</h3>
            <p className="text-body text-neutral-500 mb-4">Hotels, lodges, and guesthouses can list properties and manage room availability and rates.</p>
            <ul className="space-y-2 text-body text-neutral-600">
              <li>• List rooms with photos and amenities</li>
              <li>• Set rates and cancellation policies</li>
              <li>• Manage availability calendars</li>
              <li>• Receive confirmed reservations</li>
            </ul>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-brand-50 rounded-sm flex items-center justify-center mb-4">
              <Compass size={24} className="text-brand-600" />
            </div>
            <h3 className="text-listing font-bold text-neutral-900 mb-2">Experience Suppliers</h3>
            <p className="text-body text-neutral-500 mb-4">Tour operators and activity providers can list experiences and manage sessions.</p>
            <ul className="space-y-2 text-body text-neutral-600">
              <li>• List tours, safaris, and activities</li>
              <li>• Set session times and availability</li>
              <li>• Define participant requirements</li>
              <li>• Issue vouchers to confirmed bookings</li>
            </ul>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-brand-50 rounded-sm flex items-center justify-center mb-4">
              <Ship size={24} className="text-brand-600" />
            </div>
            <h3 className="text-listing font-bold text-neutral-900 mb-2">API & Integration</h3>
            <p className="text-body text-neutral-500 mb-4">Integrate with Travelar's platform through our API for distribution and booking management.</p>
            <ul className="space-y-2 text-body text-neutral-600">
              <li>• GDS and supplier integrations</li>
              <li>• Payment provider adapters</li>
              <li>• Real-time inventory sync</li>
              <li>• Webhook-based confirmation flows</li>
            </ul>
            <Link to="/api-enquiries" className="text-body font-medium text-brand-600 hover:text-brand-700 mt-4 inline-flex items-center gap-1">
              API enquiries <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="card p-8 bg-brand-600 text-white text-center">
          <h2 className="text-section font-bold mb-3">Ready to partner with us?</h2>
          <p className="text-body text-white/80 mb-6 max-w-xl mx-auto">Contact our partnerships team to learn more about onboarding and integration.</p>
          <Link to="/contact" className="btn-secondary bg-white border-white hover:bg-brand-50">Get in touch</Link>
        </div>
      </div>
    </div>
  );
}
