import { TANZANIA_AIRPORTS, TANZANIA_LOCATIONS, TANZANIA_STATIONS } from '@/data/locations';
import type { BookingMode } from '@/types';

export type DestinationScope = 'Tanzania' | 'East Africa' | 'The World';

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
    id: 'tanzania-zanzibar', name: 'Zanzibar', country: 'Tanzania', scope: 'Tanzania',
    description: 'Indian Ocean beaches and the historic streets of Stone Town.',
    image: 'https://images.pexels.com/photos/34777333/pexels-photo-34777333.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Turquoise beach water in Zanzibar', mode: 'ferry',
  }),
  destination({
    id: 'tanzania-dar', name: 'Dar es Salaam', country: 'Tanzania', scope: 'Tanzania',
    description: 'A lively coastal gateway for city, ferry, and onward journeys.',
    image: 'https://images.pexels.com/photos/18806088/pexels-photo-18806088.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Aerial view of Dar es Salaam harbor', mode: 'bus',
  }),
  destination({
    id: 'tanzania-arusha', name: 'Arusha', country: 'Tanzania', scope: 'Tanzania',
    description: 'A northern base for safari country and mountain adventures.',
    image: 'https://images.pexels.com/photos/2063890/pexels-photo-2063890.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'People in Arusha, Tanzania', mode: 'bus',
  }),
  destination({
    id: 'tanzania-moshi', name: 'Moshi', country: 'Tanzania', scope: 'Tanzania',
    description: 'A welcoming town at the foot of Mount Kilimanjaro.',
    image: 'https://images.pexels.com/photos/36718623/pexels-photo-36718623.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Kilimanjaro peak in the clouds', mode: 'bus',
  }),
  destination({
    id: 'tanzania-mwanza', name: 'Mwanza', country: 'Tanzania', scope: 'Tanzania',
    description: 'Lakeside landscapes and a relaxed base on Lake Victoria.',
    image: 'https://images.pexels.com/photos/25950513/pexels-photo-25950513.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Expansive African landscape', mode: 'bus',
  }),
  destination({
    id: 'tanzania-dodoma', name: 'Dodoma', country: 'Tanzania', scope: 'Tanzania',
    description: 'Tanzania\'s capital, with central connections across the country.',
    image: 'https://images.pexels.com/photos/16083443/pexels-photo-16083443.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Traveller overlooking an African landscape', mode: 'bus',
  }),
  destination({
    id: 'tanzania-mbeya', name: 'Mbeya', country: 'Tanzania', scope: 'Tanzania',
    description: 'Mountain scenery, green valleys, and southern Tanzania hospitality.',
    image: 'https://images.pexels.com/photos/20179673/pexels-photo-20179673.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Hot air balloon above an African landscape', mode: 'bus',
  }),
  destination({
    id: 'east-nairobi', name: 'Nairobi', country: 'Kenya', scope: 'East Africa',
    description: 'A fast-moving capital and gateway to Kenya\'s city and safari routes.',
    image: 'https://images.pexels.com/photos/15496531/pexels-photo-15496531.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Nairobi skyline', mode: 'flights',
  }),
  destination({
    id: 'east-mombasa', name: 'Mombasa', country: 'Kenya', scope: 'East Africa',
    description: 'Indian Ocean culture, coral coastlines, and historic old town streets.',
    image: 'https://images.pexels.com/photos/34777333/pexels-photo-34777333.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Tropical Indian Ocean coastline', mode: 'flights',
  }),
  destination({
    id: 'east-kampala', name: 'Kampala', country: 'Uganda', scope: 'East Africa',
    description: 'Uganda\'s energetic hillside capital and cultural starting point.',
    image: 'https://images.pexels.com/photos/39128396/pexels-photo-39128396.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Green East African city at sunset', mode: 'flights',
  }),
  destination({
    id: 'east-kigali', name: 'Kigali', country: 'Rwanda', scope: 'East Africa',
    description: 'A clean, green city surrounded by rolling hills.',
    image: 'https://images.pexels.com/photos/39128396/pexels-photo-39128396.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Kigali city and hills', mode: 'flights',
  }),
  destination({
    id: 'east-addis', name: 'Addis Ababa', country: 'Ethiopia', scope: 'East Africa',
    description: 'A highland capital connecting East Africa with the wider world.',
    image: 'https://images.pexels.com/photos/20027734/pexels-photo-20027734.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Waterfront city skyline', mode: 'flights',
  }),
  destination({
    id: 'world-dubai', name: 'Dubai', country: 'United Arab Emirates', scope: 'The World',
    description: 'A global hub for stopovers, shopping, and desert experiences.',
    image: 'https://images.pexels.com/photos/19612315/pexels-photo-19612315.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Dubai Marina skyline', mode: 'flights',
  }),
  destination({
    id: 'world-istanbul', name: 'Istanbul', country: 'Türkiye', scope: 'The World',
    description: 'A city where two continents meet across the Bosphorus.',
    image: 'https://images.pexels.com/photos/20027734/pexels-photo-20027734.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Istanbul waterfront skyline', mode: 'flights',
  }),
  destination({
    id: 'world-london', name: 'London', country: 'United Kingdom', scope: 'The World',
    description: 'Historic neighbourhoods, iconic landmarks, and endless culture.',
    image: 'https://images.pexels.com/photos/18806088/pexels-photo-18806088.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Aerial city and waterfront view', mode: 'flights',
  }),
  destination({
    id: 'world-cape-town', name: 'Cape Town', country: 'South Africa', scope: 'The World',
    description: 'Table Mountain, ocean drives, and a vibrant creative scene.',
    image: 'https://images.pexels.com/photos/36597753/pexels-photo-36597753.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Cape Town and Table Mountain', mode: 'flights',
  }),
  destination({
    id: 'world-bangkok', name: 'Bangkok', country: 'Thailand', scope: 'The World',
    description: 'Riverfront energy, street food, temples, and modern city life.',
    image: 'https://images.pexels.com/photos/37391280/pexels-photo-37391280.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    alt: 'Bangkok skyline beside the river', mode: 'flights',
  }),
];

export const DESTINATION_SCOPES: Array<'All' | DestinationScope> = ['All', 'Tanzania', 'East Africa', 'The World'];
