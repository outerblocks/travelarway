import { sabreFlightAdapter } from '@/server/providers/sabre/flights';
import { sabreRailAdapter } from '@/server/providers/sabre/rail';
import { sabreStayAdapter } from '@/server/providers/sabre/stays';
import { unsupported, type FlightSupplierAdapter, type StaySupplierAdapter } from '@/server/providers/types';

export { sabreFlightAdapter, sabreRailAdapter, sabreStayAdapter };

export const amadeusFlightAdapter: FlightSupplierAdapter = {
  providerId: 'amadeus',
  productId: 'enterprise-air',
  async search(_request, meta) {
    return unsupported(meta, 'air.search');
  },
};

export const amadeusStayAdapter: StaySupplierAdapter = {
  providerId: 'amadeus',
  productId: 'enterprise-hotel',
  async search(_request, meta) {
    return unsupported(meta, 'stay.search');
  },
};
