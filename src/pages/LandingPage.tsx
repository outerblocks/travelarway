import { useState } from 'react';
import { Link } from '@/router';
import { HeroSearchCard } from '@/components/search/HeroSearchCard';
import { useApp } from '@/context/AppContext';
import { useI18n } from '@/context/I18nContext';
import { DESTINATION_DISCOVERY, DESTINATION_SCOPES, type DestinationScope } from '@/data/destinations';
import type { BookingMode } from '@/types';
import heroImage from '@/assets/hero/hero.jpg';

// ─── Hot Deals ─────────────────────────────────────────────────────────────
// NOTE: These entries represent the structure for promotional offers. Replace
// with a real data source (CMS, API, or database table) when one is available.
// The section will not render any fabricated "live" prices or availability -
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
    excerpt: 'Everything you need to know about booking, boarding, and what to expect on the crossing, including resident and non-resident fares.',
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
    excerpt: 'An overview of Zanzibar\'s accommodation zones, including Stone Town, the east coast, and the north, with guidance on what suits different travel styles.',
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

const DEAL_TEXT_KEYS = {
  'deal-ferry-znz': { title: 'dealFerryTitle', subtitle: 'ferryFastCatamaran', badge: 'ferry' },
  'deal-bus-arusha': { title: 'dealBusTitle', subtitle: 'busDepartures', badge: 'bus' },
  'deal-stay-znz': { title: 'dealStayTitle', subtitle: 'beachfrontPoolVillas', badge: 'stays' },
} as const;

const GUIDE_TEXT_KEYS = {
  'guide-ferry-znz': ['ferryGuideTitle', 'ferryGuideExcerpt', 'ferry'],
  'guide-safari': ['safariGuideTitle', 'safariGuideExcerpt', 'experiences'],
  'guide-stays': ['staysGuideTitle', 'staysGuideExcerpt', 'stays'],
  'guide-kili': ['kilimanjaroGuideTitle', 'kilimanjaroGuideExcerpt', 'experiences'],
  'guide-east-africa': ['eastAfricaGuideTitle', 'eastAfricaGuideExcerpt', 'eastAfrica'],
  'guide-international': ['stopoverGuideTitle', 'stopoverGuideExcerpt', 'international'],
} as const;

const COUNTRY_CODES: Record<string, string> = {
  Tanzania: 'TZ',
  Japan: 'JP',
  Switzerland: 'CH',
  Greece: 'GR',
  Italy: 'IT',
  France: 'FR',
  'United States': 'US',
  Maldives: 'MV',
  Türkiye: 'TR',
  'United Arab Emirates': 'AE',
  Indonesia: 'ID',
};

const DESTINATION_DESCRIPTIONS: Record<string, Partial<Record<'sw' | 'fr', string>>> = {
  'tanzania-zanzibar': {
    sw: 'Fukwe za Bahari ya Hindi na mitaa ya kihistoria ya Stone Town.',
    fr: 'Plages de l’océan Indien et ruelles historiques de Stone Town.',
  },
  'tanzania-dar-es-salaam': {
    sw: 'Jiji la pwani na lango la safari kote Tanzania.',
    fr: 'Ville côtière et point de départ pour voyager en Tanzanie.',
  },
  'world-tokyo': {
    sw: 'Barabara zenye mwanga, vitongoji vyenye uhai na utamaduni wa Japani.',
    fr: 'Rues animées, quartiers vivants et culture japonaise.',
  },
  'world-switzerland': {
    sw: 'Mandhari ya milima ya Alps, miji ya kando ya ziwa na mapumziko milimani.',
    fr: 'Paysages alpins, villes au bord des lacs et escapades en montagne.',
  },
  'world-santorini': {
    sw: 'Vijiji vya visiwa vyenye nyumba nyeupe zinazoangalia Bahari ya Aegean.',
    fr: 'Villages blancs perchés au-dessus de la mer Égée.',
  },
  'world-rome': {
    sw: 'Alama za kale, mitaa ya kihistoria na maisha ya jiji la Italia.',
    fr: 'Monuments antiques, rues historiques et art de vivre italien.',
  },
  'world-paris': {
    sw: 'Alama maarufu, matembezi kando ya mto na vitongoji vya Paris.',
    fr: 'Monuments emblématiques, promenades au bord de la Seine et quartiers parisiens.',
  },
  'world-new-york': {
    sw: 'Mandhari maarufu ya majengo marefu na vitongoji vyenye nguvu.',
    fr: 'Une silhouette urbaine célèbre et des quartiers pleins d’énergie.',
  },
  'world-maldives': {
    sw: 'Maji safi ya visiwa na malazi juu ya maji katika Bahari ya Hindi.',
    fr: 'Eaux cristallines et villas sur pilotis dans l’océan Indien.',
  },
  'world-istanbul': {
    sw: 'Jiji la pwani linalounganisha Ulaya na Asia.',
    fr: 'Une ville au bord de l’eau entre l’Europe et l’Asie.',
  },
  'world-dubai': {
    sw: 'Mandhari ya kuvutia ya majengo, ufukwe na shughuli za jangwani.',
    fr: 'Gratte-ciel remarquables, front de mer et expériences dans le désert.',
  },
  'world-bali': {
    sw: 'Mandhari ya kitropiki, mahekalu na utamaduni wa kisiwa cha Bali.',
    fr: 'Paysages tropicaux, temples et culture balinaise.',
  },
};

export function LandingPage() {
  const { setActiveMode } = useApp();
  const { tp, lang } = useI18n();
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
      <section id="hero-search" className="relative z-20 bg-ink">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-[center_58%] sm:bg-center"
          style={{ backgroundImage: `url(${heroImage})`, height: '100%' }}
        />

        <div className="relative flex min-h-[480px] flex-col pb-6 sm:min-h-[460px] lg:min-h-[420px] overflow-visible">
          <div className="section-container pt-10 sm:pt-12 lg:pt-14">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              {tp('whereToNext')}
            </h1>
          </div>

          <div className="mt-6 flex w-full flex-1 items-end overflow-visible">
            <div className="section-container w-full pb-2 overflow-visible">
              <HeroSearchCard />
            </div>
          </div>
        </div>
      </section>


      <section aria-labelledby="offers-heading" className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="section-container">
          <div className="mb-8 max-w-2xl">
            <h2 id="offers-heading" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {tp('popularWaysToGo')}
            </h2>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-6">
            {HOT_DEALS.map((deal) => {
              const dealCopy = DEAL_TEXT_KEYS[deal.id as keyof typeof DEAL_TEXT_KEYS];
              return (
              <article
                key={deal.id}
                className="flex w-[84vw] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white sm:w-auto sm:max-w-none"
              >
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                    <img
                      src={deal.image}
                      alt={deal.imageAlt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="mb-1 text-lg font-semibold leading-snug text-ink">{tp(dealCopy.title)}</h3>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-neutral-600">{tp(dealCopy.subtitle)}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-neutral-100 pt-4">
                    <div>
                      <p className="text-meta text-neutral-500">{tp(deal.id === 'deal-stay-znz' ? 'subjectToAvailability' : 'fromPublishedFare')}</p>
                      <p className="text-lg font-semibold text-ink">{deal.fromPrice}</p>
                    </div>
                    <button
                      onClick={() => handleExploreMode(deal.mode)}
                      className="btn-gold min-h-10 shrink-0 px-4 py-2 text-xs"
                    >
                      {tp('search')}
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="destinations-heading" className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="section-container">
          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 id="destinations-heading" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                {tp('exploreDestinations')}
              </h2>
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="tablist" aria-label={tp('destinationRegions')}>
              {DESTINATION_SCOPES.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  role="tab"
                  aria-selected={destinationScope === scope}
                  onClick={() => setDestinationScope(scope)}
                  className={`min-h-10 shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-label ${
                    destinationScope === scope
                      ? 'bg-ink text-white'
                      : 'bg-background text-neutral-600 hover:text-ink'
                  }`}
                >
                  {scope === 'All' ? tp('all') : scope === 'Tanzania' ? tp('tanzania') : tp('theWorld')}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
            {visibleDestinations.map((dest) => (
              <article key={dest.id} className="group relative overflow-hidden rounded-2xl">
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 sm:aspect-[4/5]">
                  <img
                    src={dest.image}
                    alt={dest.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  {dest.bookable && (
                    <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-ink">
                      {tp('bookable')}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                    <div className="rounded-xl bg-ink/80 px-3 py-2.5 backdrop-blur-[2px] sm:px-3.5 sm:py-3">
                      <p className="text-[10px] font-medium text-white/70 sm:text-meta">
                        {new Intl.DisplayNames([lang], { type: 'region' }).of(COUNTRY_CODES[dest.country] ?? dest.country) ?? dest.country}
                      </p>
                      <h3 className="font-display text-sm font-bold text-white sm:text-lg">{dest.name}</h3>
                      <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-snug text-white/75 sm:min-h-10 sm:text-label">
                        {lang === 'en' ? dest.description : DESTINATION_DESCRIPTIONS[dest.id]?.[lang] ?? dest.description}
                      </p>
                      {dest.bookable ? (
                        <button
                          type="button"
                          onClick={() => handleExploreMode(dest.mode)}
                          className="mt-2 inline-flex min-h-8 items-center text-[10px] font-bold text-white underline decoration-accent decoration-2 underline-offset-4 sm:mt-3 sm:min-h-9 sm:text-label"
                        >
                          {tp('explore')}
                        </button>
                      ) : (
                        <span className="mt-2 inline-flex min-h-8 items-center text-[10px] font-medium text-white/90 sm:mt-3 sm:min-h-9 sm:text-meta">
                          {tp('comingSoon')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="guides-heading" className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="section-container">
          <div className="mb-8 max-w-2xl">
            <h2 id="guides-heading" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {tp('planBetterTrip')}
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {TRAVEL_GUIDES.map((guide) => {
              const guideCopy = GUIDE_TEXT_KEYS[guide.id as keyof typeof GUIDE_TEXT_KEYS];
              return (
              <article key={guide.id} className="grid overflow-hidden rounded-2xl bg-white sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="relative aspect-[16/10] bg-neutral-100 sm:aspect-auto">
                  <img
                    src={guide.image}
                    alt={guide.imageAlt}
                    className="h-full w-full object-cover sm:absolute sm:inset-0"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-center p-5 sm:p-6">
                  <p className="mb-2 text-meta font-semibold text-ink">{tp(guideCopy[2])}</p>
                  <h3 className="mb-2 font-display text-lg font-bold leading-snug text-ink">
                    {tp(guideCopy[0])}
                  </h3>
                  <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                    {tp(guideCopy[1])}
                  </p>
                  <button
                    onClick={() => handleExploreMode(guide.mode)}
                    className="inline-flex min-h-10 items-center self-start text-sm font-bold text-ink"
                  >
                    {tp('explore')} {tp(guideCopy[2])}
                  </button>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="partners-heading" className="bg-ink py-14 sm:py-20">
        <div className="section-container">
          <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h2 id="partners-heading" className="mb-4 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {tp('growTravelBusiness')}
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-white/75">
                {tp('partnerDescription')}
              </p>
            </div>
            <div className="lg:justify-self-end">
              <Link to="/partners" className="btn-gold min-h-12 px-6 py-3">
                {tp('becomePartner')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
