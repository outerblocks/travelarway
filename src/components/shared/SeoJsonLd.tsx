import { useLocation } from '@tanstack/react-router';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  isIndexablePath,
  organizationJsonLd,
  pageCopy,
  websiteJsonLd,
} from '@/domain/seo';

export function SeoJsonLd() {
  const { pathname } = useLocation();
  if (!isIndexablePath(pathname)) return null;
  const copy = pageCopy(pathname);
  const blocks = [organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd(pathname, copy.title)];
  return (
    <>
      {blocks.map((block) => (
        <script
          key={block['@type'] as string}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

export function GuideArticleJsonLd({
  pathname,
  title,
  description,
  image,
  datePublished,
}: {
  pathname: string;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
}) {
  const payload = articleJsonLd({ pathname, title, description, image, datePublished });
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
