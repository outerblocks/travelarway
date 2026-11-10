import { describe, expect, it } from 'vitest';
import {
  documentHead,
  isIndexablePath,
  isNoindexPath,
  langFromSearch,
  pageCopy,
  robotsTxt,
  sitemapXml,
} from '@/domain/seo';

describe('public SEO rules', () => {
  it('indexes marketing and guide URLs and keeps staff and booking flows out of the index', () => {
    expect(isIndexablePath('/')).toBe(true);
    expect(isIndexablePath('/guides')).toBe(true);
    expect(isIndexablePath('/guides/dar-es-salaam-zanzibar-ferry')).toBe(true);
    expect(isIndexablePath('/bus/results')).toBe(false);
    expect(isNoindexPath('/hq')).toBe(true);
    expect(isNoindexPath('/operator/bus')).toBe(true);
    expect(isNoindexPath('/checkout')).toBe(true);
    expect(isNoindexPath('/bus/booking')).toBe(true);
    expect(isNoindexPath('/about')).toBe(false);
  });

  it('reads language from a crawlable query string', () => {
    expect(langFromSearch('?lang=sw')).toBe('sw');
    expect(langFromSearch({ lang: 'fr' })).toBe('fr');
    expect(langFromSearch({ lang: 'de' })).toBeNull();
  });

  it('points robots at the sitemap and disallows private trees', () => {
    const body = robotsTxt('https://travelar.co.tz');
    expect(body).toContain('Disallow: /hq/');
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Sitemap: https://travelar.co.tz/sitemap.xml');
    expect(body).not.toContain('Disallow: /guides');
  });

  it('emits xhtml language alternates in the sitemap', () => {
    const xml = sitemapXml([{ loc: '/', lastmod: '2026-11-10' }], 'https://travelar.co.tz');
    expect(xml).toContain('<loc>https://travelar.co.tz/</loc>');
    expect(xml).toContain('hreflang="sw"');
    expect(xml).toContain('lang=sw');
  });

  it('gives the homepage a distinct title', () => {
    expect(pageCopy('/').title).toContain('Travelar');
    expect(pageCopy('/about').title).toContain('About');
  });

  it('marks private pages noindex in document metadata', () => {
    const privateHead = documentHead('/checkout');
    const publicHead = documentHead('/about');
    expect(privateHead.meta.some((m) => 'name' in m && m.name === 'robots' && m.content === 'noindex, nofollow')).toBe(true);
    expect(publicHead.meta.some((m) => 'name' in m && m.name === 'robots' && m.content === 'index, follow')).toBe(true);
    expect(publicHead.links.some((l) => l.rel === 'canonical')).toBe(true);
    expect(publicHead.links.some((l) => l.rel === 'alternate' && l.hrefLang === 'sw')).toBe(true);
  });
});
