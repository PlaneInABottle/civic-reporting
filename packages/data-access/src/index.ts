import {
  duplicateCandidateSchema,
  publicReportSchema,
  publicTimelineEventSchema,
  reportRelationshipRequestSchema,
  reportSubmissionRequestSchema,
  type DuplicateCandidate,
  type PublicReport,
  type PublicTimelineEvent,
  type ReportRelationshipRequest,
  type ReportSubmissionRequest,
} from '@civic-reporting/contracts';
import type { Database } from '@civic-reporting/database-types';

type PublicReportRow = Database['public']['Views']['public_reports']['Row'];
type PublicTimelineRow =
  Database['public']['Views']['public_report_events']['Row'];
type DuplicateCandidateRow =
  Database['public']['Functions']['find_duplicate_candidates']['Returns'][number];

export function mapPublicReportRows(
  rows: readonly PublicReportRow[],
): PublicReport[] {
  return rows.map((row) =>
    publicReportSchema.parse({
      publicId: row.public_id,
      title: row.title,
      description: row.description,
      status: row.status,
      closeReason: row.close_reason,
      publicLabel: row.public_label,
      publicLocationPrecision: row.public_location_precision,
      publicLatitude: row.public_latitude,
      publicLongitude: row.public_longitude,
      acceptedAt: row.accepted_at,
      updatedAt: row.updated_at,
      categoryName: row.category_name,
      supportCount: row.support_count,
    }),
  );
}

export function mapPublicTimelineRows(
  rows: readonly PublicTimelineRow[],
): PublicTimelineEvent[] {
  return rows.map((row) =>
    publicTimelineEventSchema.parse({
      publicId: row.public_id,
      publicLabel: row.public_label,
      newStatus: row.new_status,
      createdAt: row.created_at,
      actorType: row.actor_type,
      source: row.source,
    }),
  );
}

export function mapDuplicateCandidateRows(
  rows: readonly DuplicateCandidateRow[],
): DuplicateCandidate[] {
  return rows.map((row) =>
    duplicateCandidateSchema.parse({
      publicId: row.public_id,
      title: row.title,
      publicLabel: row.public_label,
      categoryName: row.category_name,
      approximateDistanceMeters: row.approximate_distance_meters,
      status: row.status,
      acceptedAt: row.accepted_at,
      whySuggested: row.why_suggested,
    }),
  );
}

export function toSubmissionRpcArgs(request: ReportSubmissionRequest) {
  const parsed = reportSubmissionRequestSchema.parse(request);
  return {
    target_draft_id: parsed.draftId,
    expected_version: parsed.expectedVersion,
    request_idempotency_key: parsed.idempotencyKey,
    request_correlation_id: parsed.correlationId,
  } satisfies Database['public']['Functions']['submit_verified_report']['Args'];
}

export function toRelationshipRpcArgs(request: ReportRelationshipRequest) {
  const parsed = reportRelationshipRequestSchema.parse(request);
  return {
    target_public_id: parsed.publicId,
    requested_kind: parsed.kind,
    requested_enabled: parsed.enabled,
    requested_notification_level: parsed.notificationLevel,
    request_idempotency_key: parsed.idempotencyKey,
    request_correlation_id: parsed.correlationId,
  } satisfies Database['public']['Functions']['set_report_relationship']['Args'];
}
