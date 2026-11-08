import { describe, expect, it } from 'vitest';
import { errorsFromBody } from '@/server/providers/travelport/errors';

describe('Travelport Result.Error', () => {
  it('treats HTTP-shaped success JSON with Result.Error as a failure', () => {
    const errors = errorsFromBody({
      CatalogProductOfferingsResponse: {
        Result: {
          Error: { SourceCode: '3460', Message: 'Missing flight segments', category: 'TERMINAL' },
        },
      },
    });
    expect(errors).toEqual([
      { sourceCode: '3460', message: 'Missing flight segments', category: 'TERMINAL' },
    ]);
  });

  it('returns nothing when the payload has no Result.Error', () => {
    expect(errorsFromBody({ CatalogProductOfferingsResponse: { CatalogProductOfferings: {} } })).toEqual([]);
  });

  it('reads hotel ErrorResponse.Result.Error', () => {
    expect(errorsFromBody({
      ErrorResponse: {
        Result: {
          Error: [{ SourceCode: '1470', Message: 'SEARCH BY DATA IS INVALID', category: 'VALIDATION' }],
        },
      },
    })).toEqual([
      { sourceCode: '1470', message: 'SEARCH BY DATA IS INVALID', category: 'VALIDATION' },
    ]);
  });
});
