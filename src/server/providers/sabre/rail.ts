import { CapabilityRefusedError, assertRunnable } from '@/server/providers/registry';
import { sabreConfig } from '@/server/providers/sabre/config';
import type { AdapterResult, ProviderOperationMeta } from '@/server/providers/types';
import { unsupported } from '@/server/providers/types';

/**
 * Sabre Content Services Rail is a separate order machine from TRC SGR and
 * Madaraka Express. Public train search stays on operator inventory until this
 * product is PROVEN. Search / prebook / confirm are not mixed with local rail.
 */
export const sabreRailAdapter = {
  providerId: 'sabre' as const,
  productId: 'rail' as const,

  async search(
    _request: { originCode: string; destinationCode: string; departureDate: string },
    meta: ProviderOperationMeta,
  ): Promise<AdapterResult<never[]>> {
    const config = sabreConfig();
    if (!config) return unsupported(meta, 'rail.search');

    try {
      await assertRunnable({
        provider: 'sabre',
        product: 'rail',
        operation: 'search',
        environment: config.environment === 'PRODUCTION' ? 'PRODUCTION' : 'PREPROD',
      });
    } catch (error) {
      if (error instanceof CapabilityRefusedError) {
        return unsupported(meta, 'rail.search');
      }
      throw error;
    }

    return unsupported(meta, 'rail.search');
  },
};
