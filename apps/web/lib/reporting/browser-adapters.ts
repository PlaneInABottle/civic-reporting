'use client';

import {
  locationSearchResultSchema,
  reportSubmissionResultSchema,
  type LocalDraftEnvelope,
  type LocationSearchResult,
  type ReportRelationshipRequest,
  type ReportSubmissionRequest,
} from '@civic-reporting/contracts';
import {
  mapDuplicateCandidateRows,
  toRelationshipRpcArgs,
} from '@civic-reporting/data-access';
import { createClient } from '@/lib/supabase/browser';
import {
  getOrCreateSubmissionAttempt,
  writeLocalDraft,
} from '@/lib/local-draft';
import { nearestSyntheticLocation } from '@/lib/location/synthetic-locations';
import { draftHandshake } from '@/lib/auth/browser-adapters';
import type { ReportingFlowAdapter } from '@/components/report-flow/report-flow';
import type { RelationshipAdapter } from '@/components/reports/public-report-detail';

async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const response = await fetch(
    `/api/location/search?q=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error('location_provider_unavailable');
  const payload = (await response.json()) as { results: unknown[] };
  return payload.results.map((result) =>
    locationSearchResultSchema.parse(result),
  );
}

async function useCurrentLocation(): Promise<LocationSearchResult> {
  if (!navigator.geolocation) throw new Error('permission_unavailable');
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8_000,
      maximumAge: 60_000,
    }),
  );
  const nearest = nearestSyntheticLocation(
    position.coords.longitude,
    position.coords.latitude,
  );
  if (!nearest) throw new Error('outside_pilot_jurisdiction');
  return nearest;
}

async function findDuplicates(
  selectedLocation: LocationSearchResult,
  organizationCategoryId: string,
) {
  const publicLocation = selectedLocation.publicLocation;
  if (!publicLocation) return [];
  const { data, error } = await createClient().rpc(
    'find_duplicate_candidates',
    {
      public_longitude: publicLocation.longitude,
      public_latitude: publicLocation.latitude,
      target_organization_category_id: organizationCategoryId,
      result_limit: 5,
    },
  );
  if (error) throw error;
  return mapDuplicateCandidateRows(data ?? []);
}

async function setRelationship(request: ReportRelationshipRequest) {
  const { data, error } = await createClient().rpc(
    'set_report_relationship',
    toRelationshipRpcArgs(request),
  );
  if (error || !data?.[0]) throw error ?? new Error('relationship_failed');
  return {
    enabled: data[0].enabled,
    notificationLevel: data[0].notification_level,
    supportCount: data[0].support_count,
  };
}

async function submitReport(request: ReportSubmissionRequest) {
  const { data, error } = await createClient().functions.invoke(
    'submit-report',
    { body: request },
  );
  if (error) throw error;
  return reportSubmissionResultSchema.parse(data);
}

export const reportingFlowAdapter: ReportingFlowAdapter = {
  searchLocations,
  useCurrentLocation,
  findDuplicates,
  saveDraft(envelope: LocalDraftEnvelope) {
    return writeLocalDraft(envelope);
  },
  claimDraft() {
    return draftHandshake.claim();
  },
  setRelationship,
  getSubmissionAttempt: getOrCreateSubmissionAttempt,
  submitReport,
  navigate(path) {
    window.location.assign(path);
  },
};

export const publicRelationshipAdapter: RelationshipAdapter = {
  setRelationship,
  signIn(nextPath) {
    window.location.assign(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  },
};
