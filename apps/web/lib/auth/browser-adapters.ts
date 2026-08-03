'use client';

import {
  verifiedDraftIntentSchema,
  type VerifiedDraftIntent,
} from '@civic-reporting/contracts';
import type { Database } from '@civic-reporting/database-types';
import { toRelationshipRpcArgs } from '@civic-reporting/data-access';
import { createClient } from '@/lib/supabase/browser';
import { clearLocalDraft, readLocalDraft } from '@/lib/local-draft';
import type { DraftHandshake, OtpAuth } from '@/components/auth/otp-sign-in';

type GeneratedDraftRpcArgs =
  Database['public']['Functions']['create_verified_draft']['Args'];
type RelationshipRpcArgs =
  Database['public']['Functions']['set_report_relationship']['Args'];

interface DraftClaimOperations {
  createDraft(args: ReturnType<typeof toDraftRpcArgs>): Promise<void>;
  setRelationship(args: RelationshipRpcArgs): Promise<void>;
}

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

export async function claimVerifiedDraftIntent(
  draft: VerifiedDraftIntent,
  operations: DraftClaimOperations,
): Promise<{ ok: true; nextPath?: string }> {
  if (draft.intentKind === 'support_existing') {
    const publicId = draft.duplicateTargetPublicId;
    if (!publicId) throw new Error('support_target_required');
    await operations.setRelationship(
      toRelationshipRpcArgs({
        publicId,
        kind: 'support',
        enabled: true,
        notificationLevel: draft.notificationLevel ?? 'none',
        idempotencyKey: draft.idempotencyKey,
        correlationId: draft.correlationId,
      }),
    );
    return { ok: true, nextPath: `/reports/${publicId}?supported=1` };
  }

  await operations.createDraft(toDraftRpcArgs(draft));
  return { ok: true, nextPath: '/report/new?verified=1' };
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
    const supabase = createClient();
    let result: { ok: true; nextPath?: string };
    try {
      result = await claimVerifiedDraftIntent(draft, {
        async createDraft(args) {
          // The generator cannot express nullable PostgreSQL function arguments.
          const { error } = await supabase.rpc(
            'create_verified_draft',
            args as unknown as GeneratedDraftRpcArgs,
          );
          if (error) throw error;
        },
        async setRelationship(args) {
          const { error } = await supabase.rpc('set_report_relationship', args);
          if (error) throw error;
        },
      });
    } catch {
      return {
        ok: false,
        message:
          'The verified draft or support intent could not be copied yet. Retry from this browser.',
      };
    }
    await clearLocalDraft();
    return result;
  },
};
