import type { Metadata } from 'next';
import { InformationPage } from '@/components/information-page';

export const metadata: Metadata = {
  title: 'Privacy',
};

export default function PrivacyPage() {
  return (
    <InformationPage
      eyebrow="Plain-language pilot notice"
      summary="This local demonstration uses fictional records and must never be treated as a live public service."
      title="Privacy"
    >
      <section>
        <h2 className="text-xl font-extrabold">Location separation</h2>
        <p className="max-w-prose text-neutral">
          Exact location is restricted to the reporter and scoped staff who need
          it. Public pages use a separately stored approximate area, approved
          public point, or no public location at all.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-extrabold">Private information</h2>
        <p className="max-w-prose text-neutral">
          Reporter contact, raw addresses, original media, moderation signals,
          internal notes, delivery secrets, and legal-case details are never
          intended for public HTML, APIs, maps, messages, metadata, or previews.
        </p>
      </section>
      <section className="rounded-panel border border-failure/35 bg-error-bg p-5">
        <h2 className="m-0 text-xl font-extrabold">
          Approval is still required
        </h2>
        <p className="mb-0 mt-2 text-neutral">
          This is not a legally approved policy. A real jurisdiction, privacy
          owner, retention schedule, processor agreements, and lawful rights
          process remain launch blockers.
        </p>
      </section>
    </InformationPage>
  );
}
