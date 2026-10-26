import baliImage from '@/assets/destinations/bali.jfif';
import darEsSalaamImage from '@/assets/destinations/Dar es Salaam.jpg';
import dubaiImage from '@/assets/destinations/dubai.jpg';
import istanbulImage from '@/assets/destinations/Istanbul.webp';
import maldivesImage from '@/assets/destinations/maldives.jpg';
import newYorkImage from '@/assets/destinations/newyork.avif';
import parisImage from '@/assets/destinations/paris.jpg';
import romeImage from '@/assets/destinations/rome.avif';
import santoriniImage from '@/assets/destinations/santorini.jpg';
import switzerlandImage from '@/assets/destinations/switzerland.jpg';
import tokyoImage from '@/assets/destinations/tokyo.jpg';
import zanzibarImage from '@/assets/destinations/Zanzibar.webp';
import { TANZANIA_AIRPORTS, TANZANIA_LOCATIONS, TANZANIA_STATIONS } from '@/data/locations';
import type { BookingMode } from '@/types';

export type DestinationScope = 'Tanzania' | 'The World';

export interface DestinationDiscovery {
  id: string;
  name: string;
  country: string;
  scope: DestinationScope;
  description: string;
  image: string;
  alt: string;
  mode: BookingMode;
  bookable: boolean;
}

const configuredDestinationNames = new Set([
  ...TANZANIA_LOCATIONS.map((location) => location.name),
  ...TANZANIA_AIRPORTS.map((airport) => airport.region),
  ...TANZANIA_STATIONS.map((station) => station.region),
]);

const destination = (
  details: Omit<DestinationDiscovery, 'bookable'>,
): DestinationDiscovery => ({
  ...details,
  bookable: configuredDestinationNames.has(details.name),
});

export const DESTINATION_DISCOVERY: DestinationDiscovery[] = [
  destination({
    id: 'tanzania-zanzibar',
    name: 'Zanzibar',
    country: 'Tanzania',
    scope: 'Tanzania',
    description: 'Indian Ocean beaches and the historic streets of Stone Town.',
    image: zanzibarImage,
    alt: 'Beach and turquoise water in Zanzibar',
    mode: 'ferry',
  }),
  destination({
    id: 'tanzania-dar-es-salaam',
    name: 'Dar es Salaam',
    country: 'Tanzania',
    scope: 'Tanzania',
    description: 'A coastal city and gateway to journeys across Tanzania.',
    image: darEsSalaamImage,
    alt: 'Dar es Salaam waterfront at dusk',
    mode: 'bus',
  }),
  destination({
    id: 'world-tokyo',
    name: 'Tokyo',
    country: 'Japan',
    scope: 'The World',
    description: 'Bright city streets, vibrant neighborhoods, and Japanese culture.',
    image: tokyoImage,
    alt: 'Colorful Tokyo street at night',
    mode: 'flights',
  }),
  destination({
    id: 'world-switzerland',
    name: 'Switzerland',
    country: 'Switzerland',
    scope: 'The World',
    description: 'Alpine scenery, lakeside towns, and mountain escapes.',
    image: switzerlandImage,
    alt: 'European town beside a lake with snowy hills',
    mode: 'flights',
  }),
  destination({
    id: 'world-santorini',
    name: 'Santorini',
    country: 'Greece',
    scope: 'The World',
    description: 'Whitewashed island villages overlooking the Aegean Sea.',
    image: santoriniImage,
    alt: 'Whitewashed buildings above the sea in Santorini',
    mode: 'flights',
  }),
  destination({
    id: 'world-rome',
    name: 'Rome',
    country: 'Italy',
    scope: 'The World',
    description: 'Ancient landmarks, historic streets, and Italian city life.',
    image: romeImage,
    alt: 'Historic streets of Rome',
    mode: 'flights',
  }),
  destination({
    id: 'world-paris',
    name: 'Paris',
    country: 'France',
    scope: 'The World',
    description: 'Iconic landmarks, riverside walks, and Parisian neighborhoods.',
    image: parisImage,
    alt: 'Eiffel Tower and Paris from above',
    mode: 'flights',
  }),
  destination({
    id: 'world-new-york',
    name: 'New York',
    country: 'United States',
    scope: 'The World',
    description: 'A world-famous skyline and neighborhoods full of energy.',
    image: newYorkImage,
    alt: 'New York City skyline',
    mode: 'flights',
  }),
  destination({
    id: 'world-maldives',
    name: 'Maldives',
    country: 'Maldives',
    scope: 'The World',
    description: 'Clear island waters and overwater stays in the Indian Ocean.',
    image: maldivesImage,
    alt: 'Overwater villa in the Maldives',
    mode: 'flights',
  }),
  destination({
    id: 'world-istanbul',
    name: 'Istanbul',
    country: 'Türkiye',
    scope: 'The World',
    description: 'A waterfront city where Europe and Asia meet.',
    image: istanbulImage,
    alt: 'Istanbul waterfront and historic skyline',
    mode: 'flights',
  }),
  destination({
    id: 'world-dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    scope: 'The World',
    description: 'A striking skyline, waterfront, and desert experiences.',
    image: dubaiImage,
    alt: 'Dubai Marina skyline',
    mode: 'flights',
  }),
  destination({
    id: 'world-bali',
    name: 'Bali',
    country: 'Indonesia',
    scope: 'The World',
    description: 'A tropical island known for its beaches and lush landscapes.',
    image: baliImage,
    alt: 'Tropical scenery in Bali',
    mode: 'flights',
  }),
];

export const DESTINATION_SCOPES: Array<'All' | DestinationScope> = ['All', 'Tanzania', 'The World'];
