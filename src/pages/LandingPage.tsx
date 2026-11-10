import { Link } from '@/router';
import { HeroHeadline } from '@/components/search/HeroHeadline';
import { HeroSearchCard } from '@/components/search/HeroSearchCard';
import { useApp } from '@/context/AppContext';
import { useI18n, type PublicTranslationKey } from '@/context/I18nContext';
import { usePublishedGuides } from '@/hooks/usePublishedGuides';
import { GuidesNewsBoard } from '@/pages/guides/GuidesNewsBoard';
import type { BookingMode } from '@/types';
import busImage from '@/assets/section-images/bus.webp';
import experiencesImage from '@/assets/section-images/experiences.jpg';
import ferryImage from '@/assets/section-images/ferry.jpg';
import flightImage from '@/assets/section-images/flight_2.webp';
import hotelImage from '@/assets/section-images/hotel_2.webp';
import trainImage from '@/assets/section-images/trc.webp';
import appImage from '@/assets/app/app.png';
import heroImage from '@/assets/hero/hero.png';
import egyptFlag from '@/assets/flags/Egypt.webp';
import kenyaFlag from '@/assets/flags/Kenya.png';
import malawiFlag from '@/assets/flags/Malawi.png';
import moroccoFlag from '@/assets/flags/Morocco.png';
import mozambiqueFlag from '@/assets/flags/Mozambique.png';
import rwandaFlag from '@/assets/flags/Rwanda.png';
import southAfricaFlag from '@/assets/flags/South Africa.png';
import tanzaniaFlag from '@/assets/flags/Tanzania.png';
import ugandaFlag from '@/assets/flags/Uganda.svg';
import zambiaFlag from '@/assets/flags/Zambia.webp';

// ─── Travel options ─────────────────────────────────────────────────────────────
const TRAVEL_TILES: {
  mode: BookingMode;
  labelKey: PublicTranslationKey;
  image: string;
}[] = [
  { mode: 'ferry', labelKey: 'ferry', image: ferryImage },
  { mode: 'stays', labelKey: 'stays', image: hotelImage },
  { mode: 'flights', labelKey: 'flights', image: flightImage },
  { mode: 'train', labelKey: 'trains', image: trainImage },
  { mode: 'bus', labelKey: 'bus', image: busImage },
  { mode: 'experiences', labelKey: 'experiences', image: experiencesImage },
];

const STORE_BADGES: { id: string; src: string; altKey: PublicTranslationKey; fit: 'apple' | 'play' }[] = [
  {
    id: 'app-store',
    src: 'https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg',
    altKey: 'appStoreBadgeAlt',
    fit: 'apple',
  },
  {
    id: 'google-play',
    src: 'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png',
    altKey: 'googlePlayBadgeAlt',
    fit: 'play',
  },
];

const COUNTRY_FLAGS: { code: string; name: string; flag: string }[] = [
  { code: 'TZ', name: 'Tanzania', flag: tanzaniaFlag },
  { code: 'KE', name: 'Kenya', flag: kenyaFlag },
  { code: 'UG', name: 'Uganda', flag: ugandaFlag },
  { code: 'RW', name: 'Rwanda', flag: rwandaFlag },
  { code: 'ZA', name: 'South Africa', flag: southAfricaFlag },
  { code: 'MW', name: 'Malawi', flag: malawiFlag },
  { code: 'MZ', name: 'Mozambique', flag: mozambiqueFlag },
  { code: 'ZM', name: 'Zambia', flag: zambiaFlag },
  { code: 'EG', name: 'Egypt', flag: egyptFlag },
  { code: 'MA', name: 'Morocco', flag: moroccoFlag },
];

export function LandingPage() {
  const { setActiveMode } = useApp();
  const { tp, lang } = useI18n();
  const { status: guidesStatus, guides } = usePublishedGuides(lang);

  const handleExploreMode = (mode: BookingMode) => {
    setActiveMode(mode);
    const hero = document.getElementById('hero-search');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section id="hero-search" className="relative z-20 bg-ink">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/45" />
        </div>
        <div className="relative flex min-h-0 flex-col overflow-visible pb-4 sm:min-h-[420px] sm:pb-6 lg:min-h-[380px]">
          <div className="section-container pt-8 sm:pt-14 lg:pt-16">
            <HeroHeadline />
          </div>

          <div className="mt-5 flex w-full flex-1 items-end overflow-visible sm:mt-8">
            <div className="section-container w-full min-w-0 overflow-visible pb-2">
              <HeroSearchCard />
            </div>
          </div>
        </div>
      </section>


      {/* ─── Travel options ────────────────────────────────────────── */}
      <section aria-labelledby="options-heading" className="bg-background py-16 sm:py-20 lg:py-24">
        <div className="section-container">
          <div className="grid grid-cols-1 items-start gap-x-16 gap-y-12 lg:grid-cols-12">
            {/* Left column — text + countries */}
            <div className="lg:col-span-4">
              <h2 id="options-heading" className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {tp('allTravelOptionsTitle')}
              </h2>
              <p className="mt-4 max-w-md text-body leading-relaxed text-neutral-600">
                {tp('allTravelOptionsLead')}
              </p>

              <div className="mt-10 border-t border-neutral-200 pt-6">
                <h3 className="text-meta font-semibold uppercase tracking-widest text-neutral-500">
                  {tp('countriesAndMarkets')}
                </h3>
                <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
                  {COUNTRY_FLAGS.map((country) => (
                    <li key={country.code} className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={country.flag}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-neutral-200"
                      />
                      <span className="truncate text-label font-medium text-neutral-800">{country.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right column — travel mode tiles with text labels */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {TRAVEL_TILES.map((tile) => (
                  <button
                    key={tile.mode}
                    type="button"
                    onClick={() => handleExploreMode(tile.mode)}
                    aria-label={tp(tile.labelKey)}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
                  >
                    <img
                      src={tile.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {/* Dark overlay for text legibility */}
                    <div className="absolute inset-0 bg-neutral-900/30" aria-hidden="true" />
                    {/* Mode label */}
                    <span className="absolute inset-x-0 bottom-0 px-4 pb-4 text-left text-lg font-bold text-white sm:text-xl">
                      {tp(tile.labelKey)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Travel Guides ─────────────────────────────────────────── */}
      <section aria-labelledby="guides-heading" className="bg-background py-16 sm:py-20 lg:py-24">
        <div className="section-container">
          <div className="guides-masthead mb-8 grid gap-4 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <h2 id="guides-heading" className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {tp('planBetterTrip')}
            </h2>
            <p className="max-w-xl text-body leading-relaxed text-neutral-600 lg:justify-self-end">
              {tp('planBetterTripLead')}
            </p>
          </div>
          {guidesStatus === 'error' ? (
            <p className="text-body text-neutral-700">{tp('guidesUnavailable')}</p>
          ) : null}
          {guidesStatus === 'ready' && guides.length === 0 ? (
            <p className="text-body text-neutral-700">{tp('noGuidesYet')}</p>
          ) : null}
          {guides.length > 0 ? <GuidesNewsBoard guides={guides} showAllHref="/guides" /> : null}
        </div>
      </section>


      {/* ─── Mobile App ────────────────────────────────────────────── */}
      <section aria-labelledby="app-heading" className="bg-background py-16 sm:py-20 lg:py-24">
        <div className="section-container">
          <div className="grid overflow-hidden bg-[#7dd3fc] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
              <h2 id="app-heading" className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
                {tp('mobileAppTitle')}
              </h2>
              <p className="mt-4 max-w-md text-body leading-relaxed text-neutral-800">
                {tp('mobileAppLead')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {STORE_BADGES.map((badge) => (
                  <button
                    key={badge.id}
                    type="button"
                    disabled
                    data-fit={badge.fit}
                    className="store-badge cursor-not-allowed opacity-80"
                    title={tp('mobileAppUnavailableNote')}
                  >
                    <img src={badge.src} alt={tp(badge.altKey)} />
                  </button>
                ))}
              </div>

              <p className="mt-4 max-w-md text-meta leading-relaxed text-neutral-800/80">
                {tp('mobileAppUnavailableNote')}
              </p>
            </div>

            <div className="flex items-center justify-center bg-[#7dd3fc] px-6 py-10 sm:px-10 lg:px-8 lg:py-12">
              <img
                src={appImage}
                alt={tp('mobileAppImageAlt')}
                loading="lazy"
                className="w-full max-w-lg object-contain"
              />
            </div>
          </div>
        </div>
      </section>


      {/* ─── Partners CTA ──────────────────────────────────────────── */}
      <section aria-labelledby="partners-heading" className="bg-ink py-16 sm:py-20">
        <div className="section-container">
          <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h2 id="partners-heading" className="mb-4 max-w-2xl font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {tp('growTravelBusiness')}
              </h2>
              <p className="max-w-xl text-body leading-relaxed text-white/70">
                {tp('partnerDescription')}
              </p>
            </div>
            <div className="lg:justify-self-end">
              <Link
                to="/partners"
                className="inline-flex min-h-12 items-center rounded-lg bg-white px-6 py-3 text-body font-semibold text-ink transition-colors hover:bg-neutral-100"
              >
                {tp('becomePartner')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
