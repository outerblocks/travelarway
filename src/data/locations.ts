import type { Country, MarketConfig, BookingMode, Location } from '@/types';

export const COUNTRIES: Country[] = [
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', currency: 'TZS', currencySymbol: 'TSh' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', currency: 'KES', currencySymbol: 'KSh' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', currency: 'UGX', currencySymbol: 'USh' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', currency: 'RWF', currencySymbol: 'RF' },
  { code: 'US', name: 'United States', dialCode: '+1', currency: 'USD', currencySymbol: '$' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: 'GBP', currencySymbol: '£' },
  { code: 'IN', name: 'India', dialCode: '+91', currency: 'INR', currencySymbol: '₹' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', currency: 'ZAR', currencySymbol: 'R' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: 'NGN', currencySymbol: '₦' },
  { code: 'DE', name: 'Germany', dialCode: '+49', currency: 'EUR', currencySymbol: '€' },
  { code: 'FR', name: 'France', dialCode: '+33', currency: 'EUR', currencySymbol: '€' },
  { code: 'CN', name: 'China', dialCode: '+86', currency: 'CNY', currencySymbol: '¥' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', currency: 'BRL', currencySymbol: 'R$' },
  { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CAD', currencySymbol: 'C$' },
  { code: 'AU', name: 'Australia', dialCode: '+61', currency: 'AUD', currencySymbol: 'A$' },
  { code: 'JP', name: 'Japan', dialCode: '+81', currency: 'JPY', currencySymbol: '¥' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', currency: 'AED', currencySymbol: 'د.إ' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', currency: 'EGP', currencySymbol: 'E£' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', currency: 'GHS', currencySymbol: '₵' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', currency: 'ETB', currencySymbol: 'Br' },
];

export const ALL_MODES: BookingMode[] = ['bus', 'ferry', 'flights', 'train', 'stays', 'experiences'];

export const MARKETS: Record<string, MarketConfig> = {
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    currency: 'TZS',
    currencySymbol: 'TSh',
    languages: ['en', 'sw'],
    availableModes: ['bus', 'ferry', 'flights', 'train', 'stays', 'experiences'],
    paymentMethods: ['mobile_money', 'card'],
    mobileMoneyProviders: ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Halopesa'],
  },
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    currency: 'KES',
    currencySymbol: 'KSh',
    languages: ['en', 'sw'],
    availableModes: ['bus', 'ferry', 'flights', 'train', 'stays', 'experiences'],
    paymentMethods: ['mobile_money', 'card'],
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money', 'T-Kash'],
  },
};

export const TANZANIA_LOCATIONS: Location[] = [
  { id: 'dar', name: 'Dar es Salaam', region: 'Dar es Salaam', type: 'city', country: 'Tanzania' },
  { id: 'dar_ubungo', name: 'Ubungo Terminal', region: 'Dar es Salaam', type: 'terminal', country: 'Tanzania' },
  { id: 'dar_magomeni', name: 'Magomeni Terminal', region: 'Dar es Salaam', type: 'terminal', country: 'Tanzania' },
  { id: 'morogoro', name: 'Morogoro', region: 'Morogoro', type: 'city', country: 'Tanzania' },
  { id: 'dodoma', name: 'Dodoma', region: 'Dodoma', type: 'city', country: 'Tanzania' },
  { id: 'iringa', name: 'Iringa', region: 'Iringa', type: 'city', country: 'Tanzania' },
  { id: 'mbeya', name: 'Mbeya', region: 'Mbeya', type: 'city', country: 'Tanzania' },
  { id: 'arusha', name: 'Arusha', region: 'Arusha', type: 'city', country: 'Tanzania' },
  { id: 'moshi', name: 'Moshi', region: 'Kilimanjaro', type: 'city', country: 'Tanzania' },
  { id: 'tanga', name: 'Tanga', region: 'Tanga', type: 'city', country: 'Tanzania' },
  { id: 'mwanza', name: 'Mwanza', region: 'Mwanza', type: 'city', country: 'Tanzania' },
  { id: 'zanzibar', name: 'Zanzibar', region: 'Zanzibar', type: 'city', country: 'Tanzania' },
  { id: 'pemba', name: 'Pemba', region: 'Pemba', type: 'city', country: 'Tanzania' },
  { id: 'songwe', name: 'Songwe', region: 'Mbeya', type: 'city', country: 'Tanzania' },
  { id: 'kahama', name: 'Kahama', region: 'Shinyanga', type: 'city', country: 'Tanzania' },
  { id: 'tabora', name: 'Tabora', region: 'Tabora', type: 'city', country: 'Tanzania' },
  { id: 'kigoma', name: 'Kigoma', region: 'Kigoma', type: 'city', country: 'Tanzania' },
  { id: 'songea', name: 'Songea', region: 'Ruvuma', type: 'city', country: 'Tanzania' },
  { id: 'lindi', name: 'Lindi', region: 'Lindi', type: 'city', country: 'Tanzania' },
  { id: 'mtwara', name: 'Mtwara', region: 'Mtwara', type: 'city', country: 'Tanzania' },
];

export const TANZANIA_PORTS: Location[] = [
  { id: 'port_dar', name: 'Dar es Salaam Port', region: 'Dar es Salaam', type: 'port', country: 'Tanzania' },
  { id: 'port_znz', name: 'Zanzibar Port', region: 'Zanzibar', type: 'port', country: 'Tanzania' },
  { id: 'port_pemba', name: 'Pemba Port (Mkoani)', region: 'Pemba', type: 'port', country: 'Tanzania' },
  { id: 'port_tanga', name: 'Tanga Port', region: 'Tanga', type: 'port', country: 'Tanzania' },
  { id: 'port_mwanza', name: 'Mwanza Port', region: 'Mwanza', type: 'port', country: 'Tanzania' },
  { id: 'port_bukoba', name: 'Bukoba Port', region: 'Kagera', type: 'port', country: 'Tanzania' },
];

export const TANZANIA_AIRPORTS: Location[] = [
  { id: 'air_dar', name: 'Julius Nyerere International Airport (DAR)', region: 'Dar es Salaam', type: 'airport', country: 'Tanzania' },
  { id: 'air_znz', name: 'Abeid Amani Karume International Airport (ZNZ)', region: 'Zanzibar', type: 'airport', country: 'Tanzania' },
  { id: 'air_jro', name: 'Kilimanjaro International Airport (JRO)', region: 'Kilimanjaro', type: 'airport', country: 'Tanzania' },
  { id: 'air_mwanza', name: 'Mwanza Airport (MWZ)', region: 'Mwanza', type: 'airport', country: 'Tanzania' },
  { id: 'air_arusha', name: 'Arusha Airport (ARK)', region: 'Arusha', type: 'airport', country: 'Tanzania' },
  { id: 'air_dodoma', name: 'Dodoma Airport (DOM)', region: 'Dodoma', type: 'airport', country: 'Tanzania' },
  { id: 'air_mbe', name: 'Songwe Airport (MBE)', region: 'Mbeya', type: 'airport', country: 'Tanzania' },
  { id: 'air_nbo', name: 'Jomo Kenyatta International Airport (NBO)', region: 'Nairobi', type: 'airport', country: 'Kenya' },
  { id: 'air_jkj', name: 'Wilson Airport (WIL)', region: 'Nairobi', type: 'airport', country: 'Kenya' },
  { id: 'air_entebbe', name: 'Entebbe International Airport (EBB)', region: 'Entebbe', type: 'airport', country: 'Uganda' },
  { id: 'air_jhb', name: 'O.R. Tambo International Airport (JNB)', region: 'Johannesburg', type: 'airport', country: 'South Africa' },
  { id: 'air_dxb', name: 'Dubai International Airport (DXB)', region: 'Dubai', type: 'airport', country: 'UAE' },
  { id: 'air_lhr', name: 'Heathrow Airport (LHR)', region: 'London', type: 'airport', country: 'United Kingdom' },
  { id: 'air_cdg', name: 'Charles de Gaulle Airport (CDG)', region: 'Paris', type: 'airport', country: 'France' },
  { id: 'air_amst', name: 'Amsterdam Schiphol (AMS)', region: 'Amsterdam', type: 'airport', country: 'Netherlands' },
  { id: 'air_ist', name: 'Istanbul Airport (IST)', region: 'Istanbul', type: 'airport', country: 'Turkey' },
  { id: 'air_addis', name: 'Bole International Airport (ADD)', region: 'Addis Ababa', type: 'airport', country: 'Ethiopia' },
  { id: 'air_nairobi_wilson', name: 'Wilson Airport (WIL)', region: 'Nairobi', type: 'airport', country: 'Kenya' },
];

export const TANZANIA_STATIONS: Location[] = [
  { id: 'stn_dar_sgr', name: 'Dar es Salaam SGR Station', region: 'Dar es Salaam', type: 'station', country: 'Tanzania' },
  { id: 'stn_morogoro_sgr', name: 'Morogoro SGR Station', region: 'Morogoro', type: 'station', country: 'Tanzania' },
  { id: 'stn_dodoma_sgr', name: 'Dodoma SGR Station', region: 'Dodoma', type: 'station', country: 'Tanzania' },
  { id: 'stn_makutupora', name: 'Makutupora SGR Station', region: 'Dodoma', type: 'station', country: 'Tanzania' },
  { id: 'stn_tanga_sgr', name: 'Tanga SGR Station', region: 'Tanga', type: 'station', country: 'Tanzania' },
  { id: 'stn_nairobi_madaraka', name: 'Nairobi Terminus (Madaraka Express)', region: 'Nairobi', type: 'station', country: 'Kenya' },
  { id: 'stn_mombasa_madaraka', name: 'Mombasa Terminus (Madaraka Express)', region: 'Mombasa', type: 'station', country: 'Kenya' },
  { id: 'stn_athi_river', name: 'Athi River Station', region: 'Athi River', type: 'station', country: 'Kenya' },
  { id: 'stn_emali', name: 'Emali Station', region: 'Emali', type: 'station', country: 'Kenya' },
  { id: 'stn_voi', name: 'Voi Station', region: 'Voi', type: 'station', country: 'Kenya' },
  { id: 'stn_miaseny', name: 'Mtito Andei Station', region: 'Mtito Andei', type: 'station', country: 'Kenya' },
  { id: 'stn_kibwezi', name: 'Kibwezi Station', region: 'Kibwezi', type: 'station', country: 'Kenya' },
  { id: 'stn_mariakani', name: 'Mariakani Station', region: 'Mariakani', type: 'station', country: 'Kenya' },
  { id: 'stn_sgr_kilimanjaro', name: 'Kilimanjaro SGR Station', region: 'Kilimanjaro', type: 'station', country: 'Tanzania' },
];

export const MODE_LABELS: Record<BookingMode, string> = {
  bus: 'Bus',
  ferry: 'Ferry',
  flights: 'Flights',
  train: 'Train',
  stays: 'Stays',
  experiences: 'Experiences',
};

export const MODE_DESCRIPTIONS: Record<BookingMode, string> = {
  bus: 'Travel between cities and towns with trusted bus operators across Tanzania.',
  ferry: 'Sail to Zanzibar, Pemba, and across the lakes with reliable ferry services.',
  flights: 'Book domestic and international flights with leading airlines.',
  train: 'Ride the SGR and Madaraka Express for fast, comfortable rail travel.',
  stays: 'Find hotels, lodges, and guesthouses for your journey.',
  experiences: 'Discover tours, safaris, and activities at your destination.',
};

export const MODE_ICONS: Record<BookingMode, string> = {
  bus: 'Bus',
  ferry: 'Ship',
  flights: 'Plane',
  train: 'TrainFront',
  stays: 'BedDouble',
  experiences: 'Compass',
};
