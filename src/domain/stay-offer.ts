export interface PublicStayRoom {
  id: string;
  name: string;
  description: string | null;
  board: string | null;
  cancellation: string | null;
  refundable: boolean | null;
  occupancy: number | null;
  totalPrice: number | null;
  currency: string | null;
}

export interface PublicStayReview {
  text: string;
  author: string | null;
  score: number | null;
  date: string | null;
}

export interface PublicStayOffer {
  id: string;
  name: string;
  location: string;
  address: string | null;
  photoUrls: string[];
  starRating: number | null;
  amenities: string[];
  distance: string | null;
  description: string | null;
  reviews: PublicStayReview[];
  totalPrice: number | null;
  currency: string | null;
  rooms: PublicStayRoom[];
}

export function asPublicStayOffer(row: unknown): PublicStayOffer {
  const offer = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const photos = Array.isArray(offer.photoUrls) ? offer.photoUrls.filter((url): url is string => typeof url === 'string' && url.startsWith('https://')) : [];
  const amenities = Array.isArray(offer.amenities) ? offer.amenities.filter((name): name is string => typeof name === 'string') : [];
  const rooms = Array.isArray(offer.rooms) ? offer.rooms.flatMap(asPublicStayRoom) : [];
  const reviews = Array.isArray(offer.reviews) ? offer.reviews.flatMap(asPublicStayReview) : [];
  return {
    id: String(offer.id ?? ''),
    name: String(offer.name ?? ''),
    location: String(offer.location ?? ''),
    address: typeof offer.address === 'string' ? offer.address : null,
    photoUrls: photos,
    starRating: typeof offer.starRating === 'number' ? offer.starRating : null,
    amenities,
    distance: typeof offer.distance === 'string' ? offer.distance : null,
    description: typeof offer.description === 'string' ? offer.description : null,
    reviews,
    totalPrice: typeof offer.totalPrice === 'number' ? offer.totalPrice : null,
    currency: typeof offer.currency === 'string' ? offer.currency : null,
    rooms,
  };
}

function asPublicStayReview(row: unknown): PublicStayReview[] {
  if (!row || typeof row !== 'object') return [];
  const review = row as Record<string, unknown>;
  const text = typeof review.text === 'string' ? review.text.trim() : '';
  if (!text) return [];
  const score = typeof review.score === 'number' && Number.isFinite(review.score) ? review.score : null;
  return [{
    text,
    author: typeof review.author === 'string' && review.author.trim() ? review.author.trim() : null,
    score,
    date: typeof review.date === 'string' && review.date.trim() ? review.date.trim() : null,
  }];
}

function asPublicStayRoom(row: unknown): PublicStayRoom[] {
  if (!row || typeof row !== 'object') return [];
  const room = row as Record<string, unknown>;
  const id = String(room.id ?? '');
  const name = String(room.name ?? '').trim();
  if (!id || !name) return [];
  const occupancy = typeof room.occupancy === 'number' ? room.occupancy : null;
  return [{
    id,
    name,
    description: typeof room.description === 'string' ? room.description : null,
    board: typeof room.board === 'string' ? room.board : null,
    cancellation: typeof room.cancellation === 'string' ? room.cancellation : null,
    refundable: typeof room.refundable === 'boolean' ? room.refundable : null,
    occupancy: occupancy != null && Number.isFinite(occupancy) ? occupancy : null,
    totalPrice: typeof room.totalPrice === 'number' ? room.totalPrice : null,
    currency: typeof room.currency === 'string' ? room.currency : null,
  }];
}

export function roomFromOffer(offer: PublicStayOffer, roomId: string | undefined): PublicStayRoom | null {
  if (!roomId) return null;
  return offer.rooms.find((room) => room.id === roomId) ?? null;
}
