import { describe, expect, it } from 'vitest';
import { toDraftRpcArgs } from '@/lib/auth/browser-adapters';

describe('Phase 2 verified draft RPC mapping', () => {
  it('preserves a withheld public location as null coordinates', () => {
    const args = toDraftRpcArgs({
      organizationCategoryId: '30000000-0000-4000-8000-000000000001',
      description: 'Synthetic withheld-location draft for adapter testing.',
      exactLocation: { longitude: 0.0042, latitude: 0.0031 },
      exactAddress: 'Synthetic protected location',
      publicLocation: null,
      publicLabel: 'Location withheld',
      publicLocationPrecision: 'withheld',
      publicationPolicyVersion: 1,
      idempotencyKey: 'a1000000-0000-4000-8000-000000000091',
      correlationId: 'a1000000-0000-4000-8000-000000000092',
    });

    expect(args.public_latitude).toBeNull();
    expect(args.public_longitude).toBeNull();
  });
});
