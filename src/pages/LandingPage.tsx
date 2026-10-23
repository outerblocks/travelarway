import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Ticket, ArrowRight, BedDouble, Compass, Handshake, HelpCircle, Tag, BookOpen, ChevronRight } from 'lucide-react';
import { HeroSearchCard } from '@/components/search/HeroSearchCard';
import { useApp } from '@/context/AppContext';
import { DESTINATION_DISCOVERY, DESTINATION_SCOPES, type DestinationScope } from '@/data/destinations';
import type { BookingMode } from '@/types';

// ─── Hot Deals ─────────────────────────────────────────────────────────────
// NOTE: These entries represent the structure for promotional offers. Replace
// with a real data source (CMS, API, or database table) when one is available.
// The section will not render any fabricated "live" prices or availability —
// prices shown are the same published fares already used across the app.
const HOT_DEALS = [
  {
    id: 'deal-ferry-znz',
    title: 'Dar es Salaam → Zanzibar',
    subtitle: 'Ferry · Fast catamaran service',
    image: 'https://images.pexels.com/photos/31263061/pexels-photo-31263061.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Boats at Dar es Salaam port',
    badge: 'Ferry',
    fromPrice: 'USD 30',
    note: 'From published fare',
    mode: 'ferry' as BookingMode,
  },
  {
    id: 'deal-bus-arusha',
    title: 'Dar es Salaam → Arusha',
    subtitle: 'Bus · Overnight & daytime departures',
    image: 'https://images.pexels.com/photos/31880118/pexels-photo-31880118.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Bus on the road',
    badge: 'Bus',
    fromPrice: 'TSh 18,000',
    note: 'From published fare',
    mode: 'bus' as BookingMode,
  },
  {
    id: 'deal-stay-znz',
    title: 'Zanzibar Beach Resort',
    subtitle: 'Stays · Beachfront pool villas',
    image: 'https://images.pexels.com/photos/30165022/pexels-photo-30165022.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Modern resort pool in Zanzibar',
    badge: 'Stays',
    fromPrice: 'From partner rates',
    note: 'Subject to availability',
    mode: 'stays' as BookingMode,
  },
];

// ─── Travel Guides ──────────────────────────────────────────────────────────
// NOTE: These entries are editorial placeholders that describe real content
// categories. Connect to a CMS or content API to serve live articles with
// actual publication dates and author information.
const TRAVEL_GUIDES = [
  {
    id: 'guide-ferry-znz',
    category: 'Ferry',
    title: 'How to travel from Dar es Salaam to Zanzibar by ferry',
    excerpt: 'Everything you need to know about booking, boarding, and what to expect on the crossing — including resident and non-resident fares.',
    image: 'https://images.pexels.com/photos/31263061/pexels-photo-31263061.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Ferry boats at Dar es Salaam port',
    mode: 'ferry' as BookingMode,
  },
  {
    id: 'guide-safari',
    category: 'Experiences',
    title: 'Planning your first Tanzania safari: a practical guide',
    excerpt: 'From choosing the right park to understanding safari types, this guide covers the essentials for first-time visitors to the Serengeti and beyond.',
    image: 'https://images.pexels.com/photos/32957448/pexels-photo-32957448.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Safari guide in a jeep near a giraffe',
    mode: 'experiences' as BookingMode,
  },
  {
    id: 'guide-stays',
    category: 'Stays',
    title: 'Where to stay in Zanzibar: beach, town, and budget options',
    excerpt: 'An overview of Zanzibar\'s accommodation zones — Stone Town, the east coast, and the north — with guidance on what suits different travel styles.',
    image: 'https://images.pexels.com/photos/30165022/pexels-photo-30165022.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Modern resort pool in Zanzibar',
    mode: 'stays' as BookingMode,
  },
  {
    id: 'guide-kili',
    category: 'Experiences',
    title: 'Climbing Kilimanjaro: routes, preparation, and what to bring',
    excerpt: 'A straightforward overview of the main Kilimanjaro routes, physical preparation, permit requirements, and gear recommendations.',
    image: 'https://images.pexels.com/photos/16083443/pexels-photo-16083443.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Traveller with backpack in African landscape',
    mode: 'experiences' as BookingMode,
  },
  {
    id: 'guide-east-africa',
    category: 'East Africa',
    title: 'Planning a cross-border East Africa journey',
    excerpt: 'A planning topic for comparing regional routes, airports, and connections as you build a multi-country itinerary.',
    image: 'https://images.pexels.com/photos/15496531/pexels-photo-15496531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Nairobi skyline in East Africa',
    mode: 'flights' as BookingMode,
  },
  {
    id: 'guide-international',
    category: 'International',
    title: 'Making the most of an international stopover',
    excerpt: 'A planning topic for choosing a convenient stopover, checking onward connections, and leaving room for the unexpected.',
    image: 'https://images.pexels.com/photos/19612315/pexels-photo-19612315.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageAlt: 'Dubai Marina skyline',
    mode: 'flights' as BookingMode,
  },
];

const BADGE_COLORS: Record<string, string> = {
  Ferry: 'bg-blue-100 text-blue-700',
  Bus: 'bg-amber-100 text-amber-700',
  Flights: 'bg-sky-100 text-sky-700',
  Train: 'bg-emerald-100 text-emerald-700',
  Stays: 'bg-violet-100 text-violet-700',
  Experiences: 'bg-rose-100 text-rose-700',
  'East Africa': 'bg-teal-100 text-teal-700',
  International: 'bg-slate-100 text-slate-700',
};

export function LandingPage() {
  const { setActiveMode } = useApp();
  const [destinationScope, setDestinationScope] = useState<'All' | DestinationScope>('All');
  const visibleDestinations = destinationScope === 'All'
    ? DESTINATION_DISCOVERY
    : DESTINATION_DISCOVERY.filter((destination) => destination.scope === destinationScope);

  const handleExploreMode = (mode: BookingMode) => {
    setActiveMode(mode);
    const hero = document.getElementById('hero-search');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section id="hero-search" className="relative overflow-visible">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.pexels.com/photos/20179666/pexels-photo-20179666.jpeg?auto=compress&cs=tinysrgb&h=1280&w=1920")',
            height: '100%',
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand-900/75 via-brand-800/60 to-brand-700/50" />

        <div className="relative">
          <div className="flex items-center justify-center text-center pt-16 pb-8 lg:pt-24 lg:pb-10" style={{ minHeight: '280px' }}>
            <div className="section-container">
              <h1 className="text-hero font-bold text-white leading-tight mb-3 drop-shadow-sm">
                Where to next?
              </h1>
              <p className="text-body lg:text-lg text-white/80 max-w-xl mx-auto">
                Your next adventure starts with Travelar.
              </p>
            </div>
          </div>

          <div className="section-container pb-0">
            <div className="max-w-5xl mx-auto">
              <HeroSearchCard />
            </div>
          </div>

          <div className="h-8" />
        </div>
      </section>

      {/* ── HOT DEALS & OFFERS ─────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-neutral-50">
        <div className="section-container">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tag size={22} className="text-brand-600" />
              <h2 className="text-section font-bold text-neutral-900">Hot Deals &amp; Offers</h2>
            </div>
          </div>
          <p className="text-body text-neutral-500 mb-8">
            Featured published fares and partner services across local and regional journeys. Live promotions are not configured yet, so no discounts or expiry claims are shown.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOT_DEALS.map((deal) => (
              <div key={deal.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
                <div className="relative overflow-hidden h-44">
                  <img
                    src={deal.image}
                    alt={deal.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-sm text-label font-semibold ${BADGE_COLORS[deal.badge] ?? 'bg-brand-50 text-brand-700'}`}>
                    {deal.badge}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-listing font-bold text-neutral-900 mb-1 leading-snug">{deal.title}</h3>
                  <p className="text-body text-neutral-500 mb-4">{deal.subtitle}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-meta text-neutral-400">{deal.note}</p>
                      <p className="text-listing font-bold text-brand-600">{deal.fromPrice}</p>
                    </div>
                    <button
                      onClick={() => handleExploreMode(deal.mode)}
                      className="btn-primary py-2 px-4 text-label"
                    >
                      Search <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE POPULAR DESTINATIONS ───────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="section-container">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={22} className="text-brand-600" />
            <h2 className="text-section font-bold text-neutral-900">Explore Popular Destinations</h2>
          </div>
          <p className="text-body text-neutral-500 mb-6">Discover journeys across Tanzania, East Africa, and the wider world.</p>
          <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Destination regions">
            {DESTINATION_SCOPES.map((scope) => (
              <button
                key={scope}
                type="button"
                role="tab"
                aria-selected={destinationScope === scope}
                onClick={() => setDestinationScope(scope)}
                className={`rounded-full px-4 py-2 text-label font-medium transition-colors ${
                  destinationScope === scope
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleDestinations.map((dest) => (
              <div key={dest.id} className="group relative overflow-hidden rounded-lg">
                <img
                  src={dest.image}
                  alt={dest.alt}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h3 className="text-listing font-bold text-white leading-tight">{dest.name}</h3>
                    <span className="text-meta text-white/75">{dest.country}</span>
                  </div>
                  <p className="text-label text-white/85 line-clamp-2">{dest.description}</p>
                  {dest.bookable ? (
                    <button
                      type="button"
                      onClick={() => handleExploreMode(dest.mode)}
                      className="inline-flex items-center gap-1 mt-3 text-label font-medium text-white/90 hover:text-white transition-colors"
                    >
                      Start a search <ArrowRight size={14} />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-3 text-meta font-medium text-white/70">
                      Discovery only
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRAVEL GUIDES & TIPS ───────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-neutral-50">
        <div className="section-container">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={22} className="text-brand-600" />
            <h2 className="text-section font-bold text-neutral-900">Travel Guides &amp; Tips</h2>
          </div>
          <p className="text-body text-neutral-500 mb-8">
            Editorial previews for planning journeys across Tanzania, East Africa, and international destinations. Live articles require a connected content source.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRAVEL_GUIDES.map((guide) => (
              <div key={guide.id} className="card overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
                <div className="relative overflow-hidden h-40 shrink-0">
                  <img
                    src={guide.image}
                    alt={guide.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-sm text-label font-semibold ${BADGE_COLORS[guide.category] ?? 'bg-brand-50 text-brand-700'}`}>
                    {guide.category}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-body font-bold text-neutral-900 mb-2 leading-snug line-clamp-2">{guide.title}</h3>
                  <p className="text-label text-neutral-500 line-clamp-3 flex-1">{guide.excerpt}</p>
                  <button
                    onClick={() => handleExploreMode(guide.mode)}
                    className="mt-4 inline-flex items-center gap-1 text-label font-medium text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Read guide <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STAYS & EXPERIENCES PROMO ─────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card overflow-hidden">
              <img
                src="https://images.pexels.com/photos/6434592/pexels-photo-6434592.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Hotel room interior"
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <BedDouble size={20} className="text-brand-600" />
                  <h3 className="text-listing font-bold text-neutral-900">Find your stay</h3>
                </div>
                <p className="text-body text-neutral-500 mb-4">
                  Hotels, lodges, and guesthouses for every budget — from city stays to beach resorts.
                </p>
                <button onClick={() => handleExploreMode('stays')} className="btn-secondary">
                  Search stays <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="card overflow-hidden">
              <img
                src="https://images.pexels.com/photos/4404518/pexels-photo-4404518.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Safari tour"
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Compass size={20} className="text-brand-600" />
                  <h3 className="text-listing font-bold text-neutral-900">Book experiences</h3>
                </div>
                <p className="text-body text-neutral-500 mb-4">
                  Safaris, cultural tours, and adventures at your destination.
                </p>
                <button onClick={() => handleExploreMode('experiences')} className="btn-secondary">
                  Search experiences <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-neutral-50">
        <div className="section-container">
          <h2 className="text-section font-bold text-neutral-900 mb-2">How Travelar works</h2>
          <p className="text-body text-neutral-500 mb-8">Three simple steps to your next journey.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Search', desc: 'Enter your route, date, and passenger details to find available options.' },
              { icon: MapPin, title: 'Choose', desc: 'Compare operators, schedules, fares, and amenities to pick the right service.' },
              { icon: Ticket, title: 'Book', desc: 'Enter passenger details, pay securely, and receive your ticket or booking confirmation.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <step.icon size={28} className="text-white" />
                </div>
                <div className="text-meta font-bold text-brand-600 uppercase tracking-wide mb-2">Step {i + 1}</div>
                <h3 className="text-listing font-bold text-neutral-900 mb-2">{step.title}</h3>
                <p className="text-body text-neutral-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS CTA ──────────────────────────────────────────── */}
      <section className="py-16 lg:py-20 bg-brand-600">
        <div className="section-container text-center">
          <Handshake size={48} className="text-white/80 mx-auto mb-4" />
          <h2 className="text-section font-bold text-white mb-3">Travel and transport partners</h2>
          <p className="text-body text-white/80 max-w-2xl mx-auto mb-6">
            Are you a bus operator, ferry company, accommodation provider, or experience supplier?
            Partner with Travelar to reach travellers across Tanzania and beyond.
          </p>
          <Link to="/partners" className="btn-secondary bg-white border-white hover:bg-brand-50">
            Become a partner <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── QUICK LINKS ───────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Ticket size={24} className="text-brand-600" />
              </div>
              <h3 className="text-listing font-bold text-neutral-900 mb-2">Manage your booking</h3>
              <p className="text-body text-neutral-500 mb-3">Retrieve your booking using your reference number.</p>
              <Link to="/manage-booking" className="text-body font-medium text-brand-600 hover:text-brand-700">
                Manage booking →
              </Link>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HelpCircle size={24} className="text-brand-600" />
              </div>
              <h3 className="text-listing font-bold text-neutral-900 mb-2">Help center</h3>
              <p className="text-body text-neutral-500 mb-3">Find answers to common questions about bookings and cancellations.</p>
              <Link to="/help" className="text-body font-medium text-brand-600 hover:text-brand-700">
                Visit help center →
              </Link>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-brand-600" />
              </div>
              <h3 className="text-listing font-bold text-neutral-900 mb-2">Cancellation policy</h3>
              <p className="text-body text-neutral-500 mb-3">Learn about cancellation and refund terms for each booking type.</p>
              <Link to="/cancellation-policy" className="text-body font-medium text-brand-600 hover:text-brand-700">
                Read policy →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
