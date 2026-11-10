export const SEO_LANGUAGES = ['en', 'sw', 'fr'] as const;
export type SeoLanguage = (typeof SEO_LANGUAGES)[number];

const DEFAULT_ORIGIN = 'https://travelar.co.tz';
const BRAND = 'Travelar';
const DEFAULT_DESCRIPTION =
  'Book bus, ferry, flights, train, stays, and experiences across Tanzania and beyond with Travelar.';

export const INDEXABLE_PATHS = [
  '/',
  '/about',
  '/contact',
  '/help',
  '/partners',
  '/api-enquiries',
  '/guides',
  '/terms',
  '/privacy',
  '/cookies',
  '/cancellation-policy',
  '/refunds',
] as const;

const NOINDEX_PREFIXES = [
  '/api/',
  '/hq',
  '/operator/',
  '/dashboard',
  '/checkout',
  '/confirmation',
  '/invite/',
  '/signin',
  '/register',
  '/manage-booking',
  '/parcels',
  '/bus/',
  '/ferry/',
  '/flights/',
  '/train/',
  '/stays/',
  '/experiences/',
];

const PAGE_COPY: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Travelar | Bus, ferry, flights, train, stays and experiences',
    description: DEFAULT_DESCRIPTION,
  },
  '/about': {
    title: 'About Travelar',
    description: 'Travelar is operated by OuterBlocks Limited. We connect travellers with bus, ferry, flight, train, stay and experience operators.',
  },
  '/contact': {
    title: 'Contact Travelar',
    description: 'Contact Travelar customer support for bookings, tickets and complaints.',
  },
  '/help': {
    title: 'Help Centre',
    description: 'Help with Travelar bookings, payments, tickets, refunds and passenger details.',
  },
  '/partners': {
    title: 'Become a Travelar operator partner',
    description: 'List bus or ferry services on Travelar. Partnership enquiries for transport operators.',
  },
  '/api-enquiries': {
    title: 'API and integration enquiries',
    description: 'Enquire about Travelar partner APIs and technical integration.',
  },
  '/guides': {
    title: 'Travel guides and tips',
    description: 'Practical Travelar guides for ferries, stays, safaris and East African journeys.',
  },
  '/terms': {
    title: 'Terms and conditions',
    description: 'Terms and conditions for using the Travelar booking platform.',
  },
  '/privacy': {
    title: 'Privacy policy',
    description: 'How Travelar and OuterBlocks Limited handle personal data.',
  },
  '/cookies': {
    title: 'Cookie policy',
    description: 'How Travelar uses cookies on the public website.',
  },
  '/cancellation-policy': {
    title: 'Cancellation and refund policy',
    description: 'Cancellation and refund rules for Travelar bookings.',
  },
  '/refunds': {
    title: 'Refunds',
    description: 'How refunds are handled for Travelar bookings.',
  },
};

export function publicSiteOrigin(): string {
  const raw = typeof process !== 'undefined' ? process.env.APP_PUBLIC_ORIGIN : undefined;
  const first = (raw ?? '').split(',')[0]?.trim().replace(/\/$/, '');
  return first || DEFAULT_ORIGIN;
}

export function langFromSearch(search: unknown): SeoLanguage | null {
  let raw: string | null = null;
  if (typeof search === 'string') {
    raw = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('lang');
  } else if (search && typeof search === 'object' && 'lang' in search) {
    const value = (search as { lang?: unknown }).lang;
    raw = typeof value === 'string' ? value : null;
  }
  if (raw === 'en' || raw === 'sw' || raw === 'fr') return raw;
  return null;
}

export function isIndexablePath(pathname: string): boolean {
  if (INDEXABLE_PATHS.includes(pathname as (typeof INDEXABLE_PATHS)[number])) return true;
  if (/^\/guides\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathname)) return true;
  return false;
}

export function isNoindexPath(pathname: string): boolean {
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml' || pathname === '/manifest.webmanifest') {
    return false;
  }
  return NOINDEX_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix));
}

export function pageCopy(pathname: string, fallback?: { title?: string; description?: string }) {
  if (fallback?.title) {
    return {
      title: fallback.title.includes(BRAND) ? fallback.title : `${fallback.title} | ${BRAND}`,
      description: fallback.description || DEFAULT_DESCRIPTION,
    };
  }
  if (PAGE_COPY[pathname]) return PAGE_COPY[pathname];
  if (pathname.startsWith('/guides/')) {
    return {
      title: `Travel guide | ${BRAND}`,
      description: PAGE_COPY['/guides'].description,
    };
  }
  return { title: `${BRAND} | Multimodal travel booking`, description: DEFAULT_DESCRIPTION };
}

export function absoluteUrl(pathname: string, origin = publicSiteOrigin(), lang?: SeoLanguage): string {
  const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const url = new URL(path, `${origin}/`);
  if (lang) url.searchParams.set('lang', lang);
  return url.toString();
}

export function robotsTxt(origin = publicSiteOrigin()): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /hq',
    'Disallow: /hq/',
    'Disallow: /operator/',
    'Disallow: /dashboard',
    'Disallow: /checkout',
    'Disallow: /confirmation',
    'Disallow: /invite/',
    'Disallow: /signin',
    'Disallow: /register',
    'Disallow: /manage-booking',
    'Disallow: /parcels',
    'Disallow: /bus/',
    'Disallow: /ferry/',
    'Disallow: /flights/',
    'Disallow: /train/',
    'Disallow: /stays/',
    'Disallow: /experiences/',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml(
  paths: { loc: string; lastmod?: string }[],
  origin = publicSiteOrigin(),
): string {
  const urls = paths
    .map((entry) => {
      const loc = absoluteUrl(entry.loc, origin);
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod.slice(0, 10)}</lastmod>` : '';
      const alternates = SEO_LANGUAGES.map(
        (lang) =>
          `    <xhtml:link rel="alternate" hreflang="${lang}" href="${absoluteUrl(entry.loc, origin, lang)}"/>`,
      ).join('\n');
      return `  <url>\n    <loc>${loc}</loc>${lastmod}\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

export function organizationJsonLd(origin = publicSiteOrigin()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    legalName: 'OuterBlocks Limited',
    url: origin,
    logo: `${origin}/travelar-logo.png`,
    parentOrganization: { '@type': 'Organization', name: 'OuterBlocks Limited' },
  };
}

export function websiteJsonLd(origin = publicSiteOrigin()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    url: origin,
    inLanguage: SEO_LANGUAGES,
    publisher: { '@type': 'Organization', name: 'OuterBlocks Limited' },
  };
}

export function breadcrumbJsonLd(pathname: string, title: string, origin = publicSiteOrigin()) {
  const items = [{ name: BRAND, path: '/' }];
  if (pathname !== '/') items.push({ name: title.replace(` | ${BRAND}`, ''), path: pathname });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}

export function articleJsonLd(input: {
  title: string;
  description: string;
  pathname: string;
  image?: string;
  datePublished?: string;
  origin?: string;
}) {
  const origin = input.origin ?? publicSiteOrigin();
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.pathname, origin),
    image: input.image ? `${origin}${input.image}` : `${origin}/travelar-logo.png`,
    datePublished: input.datePublished,
    author: { '@type': 'Organization', name: BRAND },
    publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: `${origin}/travelar-logo.png` } },
  };
}

export function documentHead(pathname: string, extras?: { title?: string; description?: string; image?: string }) {
  const origin = publicSiteOrigin();
  const indexable = isIndexablePath(pathname) && !isNoindexPath(pathname);
  const copy = pageCopy(pathname, extras);
  const canonical = absoluteUrl(pathname, origin);
  const image = extras?.image
    ? extras.image.startsWith('http')
      ? extras.image
      : `${origin}${extras.image}`
    : `${origin}/travelar-logo.png`;
  const robots = indexable ? 'index, follow' : 'noindex, nofollow';

  const links: Array<Record<string, string>> = [
    { rel: 'canonical', href: canonical },
    { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ];
  if (indexable) {
    for (const lang of SEO_LANGUAGES) {
      links.push({ rel: 'alternate', hrefLang: lang, href: absoluteUrl(pathname, origin, lang) });
    }
    links.push({ rel: 'alternate', hrefLang: 'x-default', href: canonical });
  }

  return {
    meta: [
      { title: copy.title },
      { name: 'description', content: copy.description },
      { name: 'robots', content: robots },
      { name: 'googlebot', content: robots },
      { name: 'theme-color', content: '#0055dd' },
      { property: 'og:type', content: indexable && pathname.startsWith('/guides/') ? 'article' : 'website' },
      { property: 'og:site_name', content: BRAND },
      { property: 'og:locale', content: 'en_GB' },
      { property: 'og:title', content: copy.title },
      { property: 'og:description', content: copy.description },
      { property: 'og:url', content: canonical },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: copy.title },
      { name: 'twitter:description', content: copy.description },
      { name: 'twitter:image', content: image },
    ],
    links,
    headers: indexable ? {} : { 'X-Robots-Tag': 'noindex, nofollow' },
  };
}

export function routeSeo(pathname: string, extras?: { title?: string; description?: string; image?: string }) {
  const built = documentHead(pathname, extras);
  return {
    head: () => ({ meta: built.meta, links: built.links }),
  };
}

export function webManifest() {
  return {
    name: BRAND,
    short_name: BRAND,
    description: DEFAULT_DESCRIPTION,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0055dd',
    theme_color: '#0055dd',
    lang: 'en',
    icons: [
      { src: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/travelar-logo.png', type: 'image/png', purpose: 'any' },
    ],
    // Relative URL: Chrome requires id to be same-origin as the document. An absolute
    // production origin would be ignored on localhost.
    id: '/',
  };
}
