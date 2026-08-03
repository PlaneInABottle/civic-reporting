import { describe, expect, it } from 'vitest';
import {
  authorizeRoute,
  isDeliveryTransitionAllowed,
  isDraftExpired,
  isModerationTransitionAllowed,
  isReportTransitionAllowed,
  mapOtpError,
  safeNextPath,
} from '../src/index';

const operatorContext = {
  userId: 'c0000000-0000-4000-8000-000000000003',
  email: 'operator@synthetic.invalid',
  aal: 'aal1' as const,
  organizationRoles: [
    {
      organizationId: '10000000-0000-4000-8000-000000000001',
      preset: 'operator' as const,
    },
  ],
  platformRoles: [],
};

describe('route authorization', () => {
  it('requires a session for citizen routes', () => {
    expect(authorizeRoute(null, { kind: 'citizen' })).toEqual({
      allowed: false,
      reason: 'authentication_required',
    });
  });

  it('scopes staff routes to the matching organization and preset', () => {
    expect(
      authorizeRoute(operatorContext, {
        kind: 'organization',
        organizationId: '10000000-0000-4000-8000-000000000001',
        preset: 'operator',
      }),
    ).toEqual({ allowed: true });
    expect(
      authorizeRoute(operatorContext, {
        kind: 'organization',
        organizationId: '90000000-0000-4000-8000-000000000001',
        preset: 'operator',
      }),
    ).toEqual({ allowed: false, reason: 'role_not_allowed' });
    expect(
      authorizeRoute(operatorContext, {
        kind: 'organization',
        organizationId: '10000000-0000-4000-8000-000000000001',
        preset: 'moderator',
      }),
    ).toEqual({ allowed: false, reason: 'role_not_allowed' });
  });

  it('requires aal2 for organization and platform administrators', () => {
    const organizationAdmin = {
      ...operatorContext,
      organizationRoles: [
        {
          organizationId: '10000000-0000-4000-8000-000000000001',
          preset: 'organization_admin' as const,
        },
      ],
    };
    expect(
      authorizeRoute(organizationAdmin, {
        kind: 'organization',
        organizationId: '10000000-0000-4000-8000-000000000001',
        preset: 'organization_admin',
      }),
    ).toEqual({ allowed: false, reason: 'mfa_required' });

    expect(
      authorizeRoute(
        {
          ...operatorContext,
          aal: 'aal2',
          organizationRoles: [],
          platformRoles: ['platform_admin'],
        },
        { kind: 'platform', preset: 'platform_admin' },
      ),
    ).toEqual({ allowed: true });
  });
});

describe('auth recovery boundaries', () => {
  it('allows only known local redirect roots', () => {
    expect(safeNextPath('/account/drafts?restored=1')).toBe(
      '/account/drafts?restored=1',
    );
    expect(safeNextPath('https://attacker.invalid')).toBe('/account');
    expect(safeNextPath('//attacker.invalid/admin')).toBe('/account');
    expect(safeNextPath('/contact')).toBe('/account');
  });

  it('maps invalid, expired, and throttled OTP errors to recoverable states', () => {
    expect(mapOtpError('Token has expired or is invalid')).toBe(
      'expired_or_invalid',
    );
    expect(mapOtpError('Email rate limit exceeded')).toBe('rate_limited');
    expect(mapOtpError('provider unavailable')).toBe('temporarily_unavailable');
  });

  it('expires a local draft at its explicit boundary', () => {
    expect(
      isDraftExpired(
        { expiresAt: '2026-08-04T12:00:00.000Z' },
        new Date('2026-08-04T12:00:00.000Z'),
      ),
    ).toBe(true);
  });
});

describe('atomic state transition rules', () => {
  it('matches the permitted report transition graph', () => {
    expect(isReportTransitionAllowed('received', 'in_progress')).toBe(true);
    expect(isReportTransitionAllowed('in_progress', 'submitted')).toBe(false);
  });

  it('keeps moderation transitions isolated', () => {
    expect(isModerationTransitionAllowed('pending', 'escalated')).toBe(true);
    expect(isModerationTransitionAllowed('approved', 'pending')).toBe(false);
  });

  it('keeps delivery acknowledgements distinct from provider delivery', () => {
    expect(isDeliveryTransitionAllowed('attempting', 'delivered')).toBe(true);
    expect(isDeliveryTransitionAllowed('delivered', 'acknowledged')).toBe(true);
    expect(isDeliveryTransitionAllowed('queued', 'delivered')).toBe(false);
  });
});
