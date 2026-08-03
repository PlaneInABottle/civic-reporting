import { createClient } from 'npm:@supabase/supabase-js@2.112.0';
import {
  TextModerationUnavailableError,
  createTextModerationAdapter,
} from '../_shared/text-moderation.ts';
import { completedSubmissionResult } from '../_shared/submission-state.ts';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SubmissionBody = {
  draftId: string;
  expectedVersion: number;
  idempotencyKey: string;
  correlationId: string;
};

function responseHeaders(origin: string | null) {
  const configuredOrigin = Deno.env.get('WEB_ORIGIN');
  const allowedOrigin = origin && origin === configuredOrigin ? origin : null;
  return {
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function parseBody(value: unknown): SubmissionBody | null {
  if (!value || typeof value !== 'object') return null;
  const body = value as Partial<SubmissionBody>;
  if (
    typeof body.draftId !== 'string' ||
    !uuidPattern.test(body.draftId) ||
    typeof body.expectedVersion !== 'number' ||
    !Number.isInteger(body.expectedVersion) ||
    body.expectedVersion < 1 ||
    typeof body.idempotencyKey !== 'string' ||
    !uuidPattern.test(body.idempotencyKey) ||
    typeof body.correlationId !== 'string' ||
    !uuidPattern.test(body.correlationId)
  ) {
    return null;
  }
  return body as SubmissionBody;
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const configuredOrigin = Deno.env.get('WEB_ORIGIN');
  if (origin && origin !== configuredOrigin) {
    return json({ code: 'origin_not_allowed' }, 403, origin);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: responseHeaders(origin),
    });
  }
  if (request.method !== 'POST') {
    return json({ code: 'method_not_allowed' }, 405, origin);
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ code: 'service_unavailable' }, 503, origin);
  }

  const parsedBody = parseBody(await request.json().catch(() => null));
  if (!parsedBody) return json({ code: 'invalid_request' }, 400, origin);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ code: 'verified_identity_required' }, 401, origin);
  }

  const { data: submissionRows, error: submissionError } = await userClient.rpc(
    'submit_verified_report',
    {
      target_draft_id: parsedBody.draftId,
      expected_version: parsedBody.expectedVersion,
      request_idempotency_key: parsedBody.idempotencyKey,
      request_correlation_id: parsedBody.correlationId,
    },
  );
  if (submissionError || !submissionRows?.[0]) {
    const forbidden = submissionError?.code === '42501';
    return json(
      { code: forbidden ? 'submission_forbidden' : 'submission_conflict' },
      forbidden ? 403 : 409,
      origin,
    );
  }

  const submission = submissionRows[0];
  const completed = completedSubmissionResult(submission);
  if (completed) return json(completed, 200, origin);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const attemptCorrelationId = crypto.randomUUID();
  const { data: attempt, error: attemptError } = await adminClient.rpc(
    'record_text_moderation_attempt',
    {
      target_report_id: submission.report_id,
      request_correlation_id: attemptCorrelationId,
    },
  );
  if (attemptError) {
    return json(
      {
        reportId: submission.report_id,
        publicId: submission.public_id,
        reportStatus: submission.report_status,
        publicationState: submission.publication_state,
        moderation: { state: 'temporarily_unavailable', retryable: true },
      },
      200,
      origin,
    );
  }

  let moderation;
  try {
    const runtime =
      Deno.env.get('TEXT_MODERATION_RUNTIME') === 'local'
        ? 'local'
        : 'production';
    moderation = await createTextModerationAdapter({
      provider: Deno.env.get('TEXT_MODERATION_PROVIDER'),
      runtime,
    }).moderate({
      attempt,
      description: submission.moderation_text,
    });
  } catch (error) {
    if (!(error instanceof TextModerationUnavailableError)) {
      return json({ code: 'moderation_failed_closed' }, 500, origin);
    }
    return json(
      {
        reportId: submission.report_id,
        publicId: submission.public_id,
        reportStatus: submission.report_status,
        publicationState: submission.publication_state,
        moderation: { state: 'temporarily_unavailable', retryable: true },
      },
      200,
      origin,
    );
  }

  const { data: finalizedRows, error: finalizedError } = await adminClient.rpc(
    'finalize_text_moderation',
    {
      target_report_id: submission.report_id,
      requested_decision: moderation.decision,
      provider_code: moderation.code,
      request_idempotency_key: parsedBody.idempotencyKey,
      request_correlation_id: parsedBody.correlationId,
    },
  );
  if (finalizedError || !finalizedRows?.[0]) {
    return json(
      {
        reportId: submission.report_id,
        publicId: submission.public_id,
        reportStatus: submission.report_status,
        publicationState: submission.publication_state,
        moderation: { state: 'temporarily_unavailable', retryable: true },
      },
      200,
      origin,
    );
  }

  const finalized = finalizedRows[0];
  const state =
    moderation.decision === 'approved'
      ? 'published'
      : moderation.decision === 'rejected'
        ? 'rejected'
        : 'pending_review';
  return json(
    {
      reportId: submission.report_id,
      publicId: submission.public_id,
      reportStatus: finalized.report_status,
      publicationState: finalized.publication_state,
      moderation: { state, retryable: false },
    },
    200,
    origin,
  );
});
