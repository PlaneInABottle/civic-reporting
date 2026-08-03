'use client';

import type {
  DuplicateCandidate,
  LocalDraftEnvelope,
  LocationSearchResult,
  NotificationLevel,
  ReportRelationshipRequest,
  ReportSubmissionRequest,
  ReportSubmissionResult,
} from '@civic-reporting/contracts';
import { mapSubmissionFailure } from '@civic-reporting/domain';
import Link from 'next/link';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';

export interface ReportingCategory {
  id: string;
  name: string;
  emergencyExclusion: string;
  publicationPolicyVersion: number;
}

export interface ServerDraft {
  id: string;
  version: number;
  description: string;
  exactAddress: string | null;
  publicLabel: string;
  categoryName: string;
  publicLocationPrecision: string;
}

export interface ReportingFlowAdapter {
  searchLocations(query: string): Promise<LocationSearchResult[]>;
  useCurrentLocation(): Promise<LocationSearchResult>;
  findDuplicates(
    location: LocationSearchResult,
    organizationCategoryId: string,
  ): Promise<DuplicateCandidate[]>;
  saveDraft(envelope: LocalDraftEnvelope): Promise<void>;
  claimDraft(): Promise<{ ok: boolean; message?: string; nextPath?: string }>;
  setRelationship(request: ReportRelationshipRequest): Promise<{
    enabled: boolean;
    notificationLevel: NotificationLevel;
    supportCount: number;
  }>;
  getSubmissionAttempt(draftId: string): Promise<{
    idempotencyKey: string;
    correlationId: string;
  }>;
  submitReport(
    request: ReportSubmissionRequest,
  ): Promise<ReportSubmissionResult>;
  navigate(path: string): void;
}

export function ReportFlow({
  adapter,
  categories,
  initialAuthenticated,
  initialDraft,
}: {
  adapter: ReportingFlowAdapter;
  categories: ReportingCategory[];
  initialAuthenticated: boolean;
  initialDraft: ServerDraft | null;
}) {
  const [step, setStep] = useState<
    'location' | 'duplicates' | 'details' | 'review' | 'result'
  >(initialDraft ? 'review' : 'location');
  const [nonMap, setNonMap] = useState(false);
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<LocationSearchResult[]>([]);
  const [location, setLocation] = useState<LocationSearchResult | null>(null);
  const [privateAddress, setPrivateAddress] = useState('');
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [serverDraft] = useState(initialDraft);
  const [submission, setSubmission] = useState<ReportSubmissionResult | null>(
    null,
  );
  const [supportedPublicId, setSupportedPublicId] = useState<string | null>(
    null,
  );
  const errorRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const submissionAttempt = useRef<{
    idempotencyKey: string;
    correlationId: string;
  } | null>(null);

  function showError(message: string, focusDescription = false) {
    setError(message);
    if (focusDescription) {
      descriptionRef.current?.focus();
      return;
    }
    requestAnimationFrame(() => {
      errorRef.current?.focus();
    });
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const results = await adapter.searchLocations(query);
      setLocations(results);
      if (!results.length)
        showError('Address not found. Try another synthetic place.');
    } catch {
      showError(
        'Address search is unavailable. Your draft is safe; retry or use the structured synthetic list.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function locate() {
    setBusy(true);
    setError(null);
    try {
      const selected = await adapter.useCurrentLocation();
      chooseLocation(selected);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      showError(
        message.includes('outside')
          ? 'That position is outside the fictional pilot area. Use the non-map path.'
          : 'Location permission was denied or timed out. Use the complete non-map path.',
      );
      setNonMap(true);
    } finally {
      setBusy(false);
    }
  }

  function chooseLocation(selected: LocationSearchResult) {
    setLocation(selected);
    setPrivateAddress(selected.privateAddress);
    setLocations([]);
    setError(null);
  }

  async function continueFromLocation() {
    if (!location) {
      showError('Select a synthetic address or place before continuing.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setDuplicates(
        await adapter.findDuplicates(location, categoryId || categories[0]!.id),
      );
    } catch {
      showError(
        'Similar-report suggestions are temporarily unavailable. You can retry or continue without them.',
      );
    } finally {
      setBusy(false);
      setStep('duplicates');
    }
  }

  function draftEnvelope(
    intentKind: 'new_report' | 'support_existing',
    duplicateTargetPublicId?: string,
  ): LocalDraftEnvelope {
    const now = new Date();
    return {
      version: 1,
      savedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
      draft: {
        intentKind,
        organizationCategoryId: categoryId || categories[0]!.id,
        description:
          intentKind === 'support_existing'
            ? 'Private support intent for a synthetic public report.'
            : description,
        exactLocation: location!.exactLocation,
        exactAddress: privateAddress,
        publicLocation: location!.publicLocation,
        publicLabel: location!.publicLabel,
        publicLocationPrecision: location!.publicLocationPrecision,
        publicationPolicyVersion:
          categories.find((category) => category.id === categoryId)
            ?.publicationPolicyVersion ?? 1,
        idempotencyKey: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        ...(duplicateTargetPublicId
          ? {
              duplicateTargetPublicId,
              notificationLevel: 'none' as const,
            }
          : {}),
      },
    };
  }

  async function supportDuplicate(candidate: DuplicateCandidate) {
    if (!initialAuthenticated) {
      const envelope = draftEnvelope('support_existing', candidate.publicId);
      await adapter.saveDraft(envelope);
      setDraftSaved(true);
      const next = `/reports/${candidate.publicId}?supported=1`;
      adapter.navigate(`/sign-in?next=${encodeURIComponent(next)}`);
      return;
    }
    await adapter.setRelationship({
      publicId: candidate.publicId,
      kind: 'support',
      enabled: true,
      notificationLevel: 'none',
      idempotencyKey: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    });
    setSupportedPublicId(candidate.publicId);
    setStep('result');
  }

  async function saveDetails() {
    if (!categoryId || description.trim().length < 10) {
      showError('Describe the issue in at least 10 characters.', true);
      return;
    }
    const envelope = draftEnvelope('new_report');
    await adapter.saveDraft(envelope);
    setDraftSaved(true);
    if (!initialAuthenticated) {
      adapter.navigate(
        `/sign-in?next=${encodeURIComponent('/report/new?verified=1')}`,
      );
      return;
    }
    const claimed = await adapter.claimDraft();
    if (!claimed.ok) {
      showError(
        claimed.message ?? 'The verified draft could not be copied yet.',
      );
      return;
    }
    adapter.navigate('/report/new?verified=1');
  }

  async function submit() {
    if (!serverDraft) return;
    setBusy(true);
    setError(null);
    try {
      submissionAttempt.current ??= await adapter.getSubmissionAttempt(
        serverDraft.id,
      );
      const result = await adapter.submitReport({
        draftId: serverDraft.id,
        expectedVersion: serverDraft.version,
        ...submissionAttempt.current,
      });
      setSubmission(result);
      if (result.moderation.state === 'temporarily_unavailable') {
        showError(
          'Accepted by the platform, but the safety check is temporarily unavailable. One private report exists; retrying cannot create another.',
        );
      } else {
        setStep('result');
      }
    } catch (cause) {
      showError(
        mapSubmissionFailure(
          cause instanceof Error ? cause.message : 'Failed to fetch',
        ).message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <FlowProgress step={step} />
      {draftSaved ? (
        <p
          className="m-0 rounded-control border-l-4 border-civic bg-surface p-4 text-sm font-bold"
          role="status"
        >
          Draft saved on this device. Clear it before leaving a shared device.
        </p>
      ) : null}
      {error ? (
        <div
          className="rounded-control border-l-4 border-error bg-error-bg p-4 font-semibold"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
        >
          {error}
        </div>
      ) : null}

      {step === 'location' ? (
        <FlowCard heading="Where is the issue?">
          <p className="text-neutral">
            Choose a location inside the fictional Harborfield Pilot District.
            Permission is requested only after you choose it.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void locate()}
              type="button"
            >
              Use my location
            </button>
            <button
              className="secondary-button"
              onClick={() => setNonMap(true)}
              type="button"
            >
              Enter address without a map
            </button>
          </div>
          {nonMap ? (
            <form className="mt-6 grid gap-4" onSubmit={search}>
              <label className="field-label" htmlFor="location-search">
                Street, place, or landmark
                <input
                  id="location-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <button
                className="secondary-button"
                disabled={busy || query.trim().length < 2}
                type="submit"
              >
                {busy ? 'Searching…' : 'Search addresses'}
              </button>
              {locations.length ? (
                <ul
                  aria-label="Address results"
                  className="m-0 grid list-none gap-2 p-0"
                >
                  {locations.map((result) => (
                    <li key={result.id}>
                      <button
                        aria-label={`Select ${result.label}`}
                        className="result-button"
                        onClick={() => chooseLocation(result)}
                        type="button"
                      >
                        <strong>Select {result.label}</strong>
                        <span>{result.publicLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </form>
          ) : null}
          {location ? (
            <section
              aria-labelledby="selected-location"
              className="mt-6 rounded-control bg-canvas p-4"
            >
              <h3 className="m-0 text-lg font-extrabold" id="selected-location">
                Selected location
              </h3>
              <label className="field-label mt-3" htmlFor="private-address">
                Private address correction
                <input
                  id="private-address"
                  value={privateAddress}
                  onChange={(event) => setPrivateAddress(event.target.value)}
                />
              </label>
              <p className="mb-0 text-sm">
                <strong>Public:</strong> {location.publicLabel} (
                {location.publicLocationPrecision})
              </p>
            </section>
          ) : null}
          {location ? (
            <button
              className="primary-button mt-6 w-full"
              disabled={busy}
              onClick={() => void continueFromLocation()}
              type="button"
            >
              Use this location
            </button>
          ) : null}
        </FlowCard>
      ) : null}

      {step === 'duplicates' ? (
        <FlowCard heading="Is it already reported?">
          <p className="text-neutral">
            Supporting is private. Your identity is never public, notifications
            default off, and support can be undone.
          </p>
          {duplicates.length ? (
            <div className="grid gap-4">
              {duplicates.map((candidate) => (
                <article
                  aria-label={candidate.title}
                  className="rounded-control border border-ink/15 p-4"
                  key={candidate.publicId}
                >
                  <h3 className="m-0 text-lg font-extrabold">
                    {candidate.title}
                  </h3>
                  <p className="my-2 text-sm text-neutral">
                    {candidate.publicLabel} · about{' '}
                    {candidate.approximateDistanceMeters} m away
                  </p>
                  <p className="text-sm">{candidate.whySuggested}</p>
                  <button
                    className="secondary-button w-full"
                    onClick={() => void supportDuplicate(candidate)}
                    type="button"
                  >
                    This is the same issue
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p>No nearby published reports were found.</p>
          )}
          <button
            className="secondary-button mt-4 w-full"
            onClick={() => setStep('details')}
            type="button"
          >
            None of these
          </button>
        </FlowCard>
      ) : null}

      {step === 'details' ? (
        <FlowCard heading="Describe the problem">
          <label className="field-label" htmlFor="category">
            Issue category
            <select
              id="category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <p className="m-0 text-sm text-neutral">
            {
              categories.find((category) => category.id === categoryId)
                ?.emergencyExclusion
            }
          </p>
          <label className="field-label mt-4" htmlFor="description">
            What happened, and what should the responsible team know?
            <textarea
              ref={descriptionRef}
              aria-describedby="description-count"
              id="description"
              maxLength={4000}
              rows={7}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <p
            className="m-0 text-right text-sm text-neutral"
            id="description-count"
          >
            {4000 - description.length} characters remaining
          </p>
          <button
            className="primary-button mt-5 w-full"
            onClick={() => void saveDetails()}
            type="button"
          >
            Save details and verify email
          </button>
        </FlowCard>
      ) : null}

      {step === 'review' && serverDraft ? (
        <FlowCard heading="Review and submit">
          <dl className="review-list">
            <div>
              <dt>Category</dt>
              <dd>{serverDraft.categoryName}</dd>
            </div>
            <div>
              <dt>Exact location</dt>
              <dd>
                {serverDraft.exactAddress ?? 'Selected point'} — visible only to
                authorized operators and you
              </dd>
            </div>
            <div>
              <dt>Public location</dt>
              <dd>
                {serverDraft.publicLabel} ({serverDraft.publicLocationPrecision}
                )
              </dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{serverDraft.description}</dd>
            </div>
            <div>
              <dt>Media</dt>
              <dd>Disabled for this pilot</dd>
            </div>
            <div>
              <dt>Routing</dt>
              <dd>
                Likely responsible fictional organization; no delivery has
                occurred
              </dd>
            </div>
          </dl>
          <button
            className="primary-button mt-6 w-full"
            disabled={busy}
            onClick={() => void submit()}
            type="button"
          >
            {busy ? 'Submitting…' : 'Submit report'}
          </button>
          {submission?.moderation.retryable ? (
            <button
              className="secondary-button mt-3 w-full"
              disabled={busy}
              onClick={() => void submit()}
              type="button"
            >
              Retry publication check
            </button>
          ) : null}
        </FlowCard>
      ) : null}

      {step === 'result' && submission ? (
        <FlowCard
          heading={
            submission.moderation.state === 'published'
              ? 'Report published safely'
              : submission.moderation.state === 'pending_review'
                ? 'Report held for review'
                : 'Report not published'
          }
        >
          <p>
            <strong>Reference:</strong> {submission.publicId}
          </p>
          <p className="text-neutral">
            {submission.moderation.state === 'published'
              ? 'Accepted by this platform. This does not mean the fictional organization has received or acknowledged it.'
              : 'The report remains private. No organization delivery is claimed.'}
          </p>
          {submission.moderation.state === 'published' ? (
            <Link href={`/reports/${submission.publicId}`}>
              View public report
            </Link>
          ) : (
            <Link href="/account/reports">View private report status</Link>
          )}
        </FlowCard>
      ) : null}
      {step === 'result' && supportedPublicId ? (
        <FlowCard heading="Private support recorded">
          <p>
            Your identity is not public. Notifications remain off, and you can
            undo support from the report page.
          </p>
          <Link href={`/reports/${supportedPublicId}`}>View public report</Link>
        </FlowCard>
      ) : null}
    </div>
  );
}

function FlowProgress({ step }: { step: string }) {
  const labels: Record<string, string> = {
    location: 'Step 1 of 5 · Location',
    duplicates: 'Step 2 of 5 · Similar reports',
    details: 'Step 3 of 5 · Problem details',
    review: 'Step 4 of 5 · Review',
    result: 'Step 5 of 5 · Result',
  };
  return (
    <p className="m-0 text-sm font-extrabold text-civic">{labels[step]}</p>
  );
}

function FlowCard({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-panel border border-ink/15 bg-surface p-6 sm:p-8">
      <h1 className="m-0 text-3xl font-black">{heading}</h1>
      <div className="mt-5">{children}</div>
    </section>
  );
}
