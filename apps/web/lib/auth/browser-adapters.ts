'use client';

import {
  verifiedDraftIntentSchema,
  type VerifiedDraftIntent,
} from '@civic-reporting/contracts';
import type { Database } from '@civic-reporting/database-types';
import { createClient } from '@/lib/supabase/browser';
import { clearLocalDraft, readLocalDraft } from '@/lib/local-draft';
import type { DraftHandshake, OtpAuth } from '@/components/auth/otp-sign-in';

type GeneratedDraftRpcArgs =
  Database['public']['Functions']['create_verified_draft']['Args'];

export function toDraftRpcArgs(draft: VerifiedDraftIntent) {
  return {
    draft_description: draft.description,
    exact_address: draft.exactAddress ?? '',
    exact_latitude: draft.exactLocation.latitude,
    exact_longitude: draft.exactLocation.longitude,
    public_label: draft.publicLabel,
    public_latitude: draft.publicLocation?.latitude ?? null,
    public_longitude: draft.publicLocation?.longitude ?? null,
    publication_policy_version: draft.publicationPolicyVersion,
    request_correlation_id: draft.correlationId,
    request_idempotency_key: draft.idempotencyKey,
    requested_precision: draft.publicLocationPrecision,
    target_organization_category_id: draft.organizationCategoryId,
  };
}

export const otpAuth: OtpAuth = {
  async requestOtp(email) {
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error ? { ok: false, message: error.message } : { ok: true };
  },
  async verifyOtp(email, token) {
    const { error } = await createClient().auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return error ? { ok: false, message: error.message } : { ok: true };
  },
};

export const draftHandshake: DraftHandshake = {
  async hasSavedDraft() {
    return (await readLocalDraft()) !== null;
  },
  async claim() {
    const envelope = await readLocalDraft();
    if (!envelope) {
      return { ok: true };
    }
    const parsed = verifiedDraftIntentSchema.safeParse(envelope.draft);
    if (!parsed.success) {
      return {
        ok: false,
        message: 'The saved draft needs review before it can be copied.',
      };
    }
    const draft = parsed.data;
    const args = toDraftRpcArgs(draft);
    // The generator cannot express nullable PostgreSQL function arguments.
    const { error } = await createClient().rpc(
      'create_verified_draft',
      args as unknown as GeneratedDraftRpcArgs,
    );
    if (error) {
      return {
        ok: false,
        message:
          'The verified draft could not be copied yet. Retry from this browser.',
      };
    }
    await clearLocalDraft();
    return { ok: true };
  },
};
