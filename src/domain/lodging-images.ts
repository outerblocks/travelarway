/**
 * Travelport Hotel v11 returns ImageSize on the request, but many supplier CDNs still
 * embed a small size token in the URL (`_t`, `_s`, `_b`, `w=300`). Cards and the
 * lightbox stretch those into a wide frame, which is why guest rooms look soft.
 */

const SIZE_RANK: Record<string, number> = {
  ExtraLarge: 5,
  Large: 4,
  Medium: 3,
  Small: 2,
  Thumbnail: 1,
};

const SKIP_PICTURES = new Set(['Logo', 'Map', 'Promotional']);

const HTTPS_HOSTS = [
  'i.travelapi.com',
  'images.trvl-media.com',
  'exp.cdn-hotels.com',
  'media.iceportal.com',
  'multimedia.expedia.com',
  'i.travelapi.net',
];

const SMALL_QUERY = ['w', 'h', 'width', 'height', 'downsize', 'maxwidth', 'maxheight', 'rw', 'rh', 'imwidth', 'imheight'];

export function lodgingDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' && HTTPS_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))) {
      parsed.protocol = 'https:';
    }
    parsed.pathname = parsed.pathname.replace(
      /_(t|s|n|g|b|y)(\.(?:jpe?g|png|webp))$/i,
      '_z$2',
    );
    parsed.pathname = parsed.pathname.replace(/\/(\d{2,3})x(\d{2,3})\//g, (match, width, height) => {
      if (Number(width) < 800 && Number(height) < 800) return '/1000x1000/';
      return match;
    });
    parsed.pathname = parsed.pathname.replace(/\/w_(\d+)\//g, (match, width) => (
      Number(width) < 800 ? '/w_1000/' : match
    ));
    for (const key of SMALL_QUERY) parsed.searchParams.delete(key);
    return parsed.toString();
  } catch {
    return url;
  }
}

export function lodgingPhotoUrls(urls: string[]): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const url of urls) {
    if (typeof url !== 'string') continue;
    const trimmed = url.trim();
    if (!trimmed) continue;
    const display = lodgingDisplayUrl(trimmed);
    if (!display.startsWith('https://')) continue;
    if (seen.has(display)) continue;
    seen.add(display);
    unique.push(display);
  }
  return unique;
}

export interface LodgingPicture {
  url: string;
  pictureOf: string;
  caption: string;
}

const ROOM_STOP = new Set([
  'room', 'rooms', 'guest', 'the', 'and', 'with', 'bed', 'beds', 'view', 'hotel',
]);

function tokensOf(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !ROOM_STOP.has(token));
}

export function guestRoomPictureUrls(pictures: LodgingPicture[]): string[] {
  return lodgingPhotoUrls(
    pictures
      .filter((picture) => picture.pictureOf === 'GuestRoom')
      .map((picture) => picture.url),
  );
}

/** Prefer the rate's own images, then property photos whose Travelport caption names that room. */
export function photosForStayRoom(
  roomName: string,
  roomPictures: LodgingPicture[],
  propertyPictures: LodgingPicture[],
): string[] {
  const own = lodgingPhotoUrls(roomPictures.map((picture) => picture.url));
  if (own.length) return own;
  const needles = tokensOf(roomName);
  if (needles.length) {
    const matched = propertyPictures.filter((picture) => {
      const haystack = tokensOf(picture.caption);
      return needles.some((token) => haystack.includes(token));
    });
    const urls = lodgingPhotoUrls(matched.map((picture) => picture.url));
    if (urls.length) return urls;
  }
  return guestRoomPictureUrls(propertyPictures);
}

export function pictureRank(pictureOf: string): number | null {
  if (SKIP_PICTURES.has(pictureOf)) return null;
  if (pictureOf === 'GuestRoom' || pictureOf === 'Suite' || pictureOf === 'Studio') return 0;
  if (pictureOf === 'Exterior') return 1;
  if (pictureOf === 'Lobby') return 2;
  return 9;
}

export function imageSizeRank(imageSize: string | undefined, width: number | undefined): number {
  const named = imageSize ? SIZE_RANK[imageSize] : undefined;
  if (named) return named;
  if (width && Number.isFinite(width) && width > 0) return Math.min(5, Math.round(width / 250));
  return 0;
}

/** GDS property and room strings often arrive in full caps. */
export function displayLodgingText(value: string): string {
  const text = value.trim();
  if (!text) return '';
  if (/^[A-Z0-9]{2,3}$/.test(text)) return text;
  if (text === text.toUpperCase() && /[A-Z]/.test(text) && text.length > 1) {
    return text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return text;
}

export function looksLikeHumanRoomName(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  if (/^[A-Z0-9]{2,10}$/.test(text)) return false;
  if (/\s/.test(text) && /[A-Za-z]{3}/.test(text)) return true;
  return text.length >= 12 && /[A-Za-z]{4}/.test(text);
}
