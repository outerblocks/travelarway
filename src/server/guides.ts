import { query } from '@/server/db';
import { cachedRead } from '@/server/read-cache';
import type { BookingMode } from '@/types';

export const GUIDE_LOCALES = ['en', 'sw', 'fr'] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

export const GUIDE_TOPICS = ['ferry', 'stays', 'experiences', 'east_africa', 'international'] as const;
export type GuideTopic = (typeof GUIDE_TOPICS)[number];

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface PublicGuideSummary {
  slug: string;
  topic: GuideTopic;
  relatedMode: BookingMode;
  coverPath: string;
  coverAlt: string;
  title: string;
  excerpt: string;
  researchedAt: string;
}

export interface PublicGuide extends PublicGuideSummary {
  sections: GuideSection[];
}

const COVER_PATH = /^\/guides\/[a-z0-9._-]+\.(webp|jpg|png)$/;
const RELATED_MODES: BookingMode[] = ['ferry', 'stays', 'flights', 'experiences', 'bus', 'train'];

export function isGuideLocale(value: string | null | undefined): value is GuideLocale {
  return value === 'en' || value === 'sw' || value === 'fr';
}

export function parseGuideSections(raw: unknown): GuideSection[] {
  if (!Array.isArray(raw)) return [];
  const sections: GuideSection[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const heading = (item as { heading?: unknown }).heading;
    const paragraphs = (item as { paragraphs?: unknown }).paragraphs;
    if (typeof heading !== 'string' || heading.trim() === '') continue;
    if (!Array.isArray(paragraphs)) continue;
    const lines = paragraphs.filter((line): line is string => typeof line === 'string' && line.trim() !== '');
    if (lines.length === 0) continue;
    sections.push({ heading: heading.trim(), paragraphs: lines });
  }
  return sections;
}

function isTopic(value: string): value is GuideTopic {
  return (GUIDE_TOPICS as readonly string[]).includes(value);
}

function isMode(value: string): value is BookingMode {
  return RELATED_MODES.includes(value as BookingMode);
}

function asCoverPath(value: string): string | null {
  return COVER_PATH.test(value) ? value : null;
}

interface GuideRow {
  slug: string;
  topic: string;
  related_mode: string;
  cover_path: string;
  title: string;
  excerpt: string;
  cover_alt: string;
  researched_at: string;
  sections?: unknown;
}

function toSummary(row: GuideRow): PublicGuideSummary | null {
  const coverPath = asCoverPath(row.cover_path);
  if (!coverPath || !isTopic(row.topic) || !isMode(row.related_mode)) return null;
  return {
    slug: row.slug,
    topic: row.topic,
    relatedMode: row.related_mode,
    coverPath,
    coverAlt: row.cover_alt,
    title: row.title,
    excerpt: row.excerpt,
    researchedAt: row.researched_at,
  };
}

export async function listPublishedGuides(locale: GuideLocale): Promise<PublicGuideSummary[]> {
  return cachedRead(`guides:${locale}`, 300_000, () => loadPublishedGuides(locale));
}

async function loadPublishedGuides(locale: GuideLocale): Promise<PublicGuideSummary[]> {
  const result = await query<GuideRow>(
    `select g.slug, g.topic, g.related_mode, g.cover_path, g.researched_at::text as researched_at,
            coalesce(loc.title, en.title) as title,
            coalesce(loc.excerpt, en.excerpt) as excerpt,
            coalesce(loc.cover_alt, en.cover_alt) as cover_alt
       from app.travel_guide g
       join app.travel_guide_locale en
         on en.guide_id = g.id and en.locale = 'en'
       left join app.travel_guide_locale loc
         on loc.guide_id = g.id and loc.locale = $1
      where g.status = 'published'
      order by g.sort_order, g.published_at desc`,
    [locale],
  );
  return result.rows.map(toSummary).filter((row): row is PublicGuideSummary => row !== null);
}

export async function getPublishedGuide(slug: string, locale: GuideLocale): Promise<PublicGuide | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const result = await query<GuideRow>(
    `select g.slug, g.topic, g.related_mode, g.cover_path, g.researched_at::text as researched_at,
            coalesce(loc.title, en.title) as title,
            coalesce(loc.excerpt, en.excerpt) as excerpt,
            coalesce(loc.cover_alt, en.cover_alt) as cover_alt,
            coalesce(loc.sections, en.sections) as sections
       from app.travel_guide g
       join app.travel_guide_locale en
         on en.guide_id = g.id and en.locale = 'en'
       left join app.travel_guide_locale loc
         on loc.guide_id = g.id and loc.locale = $2
      where g.status = 'published' and g.slug = $1
      limit 1`,
    [slug, locale],
  );
  const row = result.rows[0];
  if (!row) return null;
  const summary = toSummary(row);
  if (!summary) return null;
  return { ...summary, sections: parseGuideSections(row.sections) };
}
