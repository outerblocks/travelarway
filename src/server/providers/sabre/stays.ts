import { CapabilityRefusedError, assertRunnable } from '@/server/providers/registry';
import { sabreConfig } from '@/server/providers/sabre/config';
import type {
  AdapterResult,
  CanonicalStayOffer,
  ProviderOperationMeta,
  StaySearchRequest,
  StaySupplierAdapter,
} from '@/server/providers/types';
import { unsupported } from '@/server/providers/types';

/**
 * Sabre hotel is a sibling of Travelport stays-v11. Content search is not booking
 * rights. This adapter refuses until hotel search is PROVEN and live shop is on.
 */
export const sabreStayAdapter: StaySupplierAdapter = {
  providerId: 'sabre',
  productId: 'hotel',

  async search(request, meta): Promise<AdapterResult<CanonicalStayOffer[]>> {
    const config = sabreConfig();
    if (!config) return unsupported(meta, 'stay.search');

    try {
      await assertRunnable({
        provider: 'sabre',
        product: 'hotel',
        operation: 'search',
        environment: config.environment === 'PRODUCTION' ? 'PRODUCTION' : 'PREPROD',
      });
    } catch (error) {
      if (error instanceof CapabilityRefusedError) {
        return unsupported(meta, 'stay.search');
      }
      throw error;
    }

    if (!config.liveShop) {
      return {
        outcome: 'unsupported',
        meta,
        errorCode: 'sabre_shop_unproven',
        safeMessage: 'Stays are not available.',
      };
    }

    void request;
    return unsupported(meta, 'stay.search');
  },
};
