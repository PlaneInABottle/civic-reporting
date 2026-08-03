import { describe, expect, it } from 'vitest';
import {
  actorContextSchema,
  localDraftEnvelopeSchema,
  otpRequestSchema,
  otpVerificationSchema,
  verifiedDraftIntentSchema,
} from '../src/index';

const validDraft = {
  organizationCategoryId: '30000000-0000-4000-8000-000000000001',
  description: 'A safe synthetic footpath issue for the local pilot.',
  exactLocation: { longitude: 0.0042, latitude: 0.0031 },
  exactAddress: 'Synthetic Block 7, Fixture Lane',
  publicLocation: { longitude: 0, latitude: 0 },
  publicLabel: 'Harborfield North (Synthetic)',
  publicLocationPrecision: 'neighborhood',
  publicationPolicyVersion: 1,
  idempotencyKey: 'a1000000-0000-4000-8000-000000000001',
  correlationId: 'a1000000-0000-4000-8000-000000000002',
};

describe('verified draft contract', () => {
  it('accepts separated exact and public locations', () => {
    expect(verifiedDraftIntentSchema.parse(validDraft)).toEqual(validDraft);
  });

  it('requires a withheld public location to omit coordinates', () => {
    expect(() =>
      verifiedDraftIntentSchema.parse({
        ...validDraft,
        publicLocationPrecision: 'withheld',
      }),
    ).toThrow();

    expect(
      verifiedDraftIntentSchema.parse({
        ...validDraft,
        publicLocationPrecision: 'withheld',
        publicLocation: null,
      }).publicLocation,
    ).toBeNull();
  });

  it('rejects invalid coordinates and short descriptions', () => {
    expect(() =>
      verifiedDraftIntentSchema.parse({
        ...validDraft,
        description: 'Too short',
        exactLocation: { longitude: 181, latitude: 0 },
      }),
    ).toThrow();
  });
});

describe('local draft and OTP contracts', () => {
  it('requires an expiring versioned local envelope', () => {
    expect(
      localDraftEnvelopeSchema.parse({
        version: 1,
        draft: validDraft,
        savedAt: '2026-08-03T12:00:00.000Z',
        expiresAt: '2026-08-04T12:00:00.000Z',
      }).version,
    ).toBe(1);
    expect(() =>
      localDraftEnvelopeSchema.parse({
        version: 1,
        draft: validDraft,
        savedAt: '2026-08-04T12:00:00.000Z',
        expiresAt: '2026-08-03T12:00:00.000Z',
      }),
    ).toThrow();
  });

  it('normalizes email and requires a six-digit pasteable code', () => {
    expect(
      otpRequestSchema.parse({ email: ' PILOT@Example.test ' }).email,
    ).toBe('pilot@example.test');
    expect(
      otpVerificationSchema.parse({
        email: 'pilot@example.test',
        token: '123456',
      }).token,
    ).toBe('123456');
    expect(() =>
      otpVerificationSchema.parse({
        email: 'pilot@example.test',
        token: '12345a',
      }),
    ).toThrow();
  });
});

describe('actor context contract', () => {
  it('keeps organization and platform presets explicit and separate', () => {
    expect(
      actorContextSchema.parse({
        userId: 'c0000000-0000-4000-8000-000000000003',
        email: 'operator@synthetic.invalid',
        aal: 'aal1',
        organizationRoles: [
          {
            organizationId: '10000000-0000-4000-8000-000000000001',
            preset: 'operator',
          },
        ],
        platformRoles: [],
      }).organizationRoles,
    ).toHaveLength(1);
  });
});
