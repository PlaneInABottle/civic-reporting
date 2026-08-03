import { safeNextPath } from '@civic-reporting/domain';
import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';

const messages = {
  mfa_required:
    'Multi-factor authentication is required for this administrator route.',
  role_not_allowed:
    'Your verified account does not have the required scoped preset.',
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const { next, reason } = await searchParams;
  const message =
    messages[reason as keyof typeof messages] ?? messages.role_not_allowed;
  return (
    <PublicShell>
      <main
        className="mx-auto max-w-[40rem] px-4 py-12 sm:px-6"
        id="main-content"
      >
        <p className="font-extrabold text-error">Permission denied</p>
        <h1 className="text-3xl font-black">This area is restricted</h1>
        <p className="text-neutral">{message}</p>
        {reason === 'mfa_required' ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-control bg-civic px-4 py-2 font-extrabold text-white"
            href={`/account/security?next=${encodeURIComponent(safeNextPath(next))}`}
          >
            Set up multi-factor authentication
          </Link>
        ) : null}
        <p className="rounded-control border-l-4 border-attention bg-warning-bg p-4">
          Access is enforced on the server and in database policy. Hiding
          navigation is not an authorization control.
        </p>
      </main>
    </PublicShell>
  );
}
