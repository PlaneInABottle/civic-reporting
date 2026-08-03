import type { Metadata } from 'next';
import { InformationPage } from '@/components/information-page';

export const metadata: Metadata = {
  title: 'Contact',
};

export default function ContactPage() {
  return (
    <InformationPage
      eyebrow="Synthetic pilot support"
      summary="This inbox and all example routes are for local testing only."
      title="Contact"
    >
      <section className="rounded-panel border border-failure/35 bg-error-bg p-5">
        <h2 className="m-0 text-xl font-extrabold">Not for urgent help</h2>
        <p className="mb-0 mt-2 text-neutral">
          This pilot is not monitored for emergencies. Use the verified
          emergency channel for the real place you are in.
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-panel border border-ink/15 bg-surface p-5">
          <h2 className="m-0 text-xl font-extrabold">Verification help</h2>
          <p className="mb-0 mt-2 text-neutral">
            The finished local flow will cover delayed, expired, incorrect, and
            resent OTP codes without losing a same-browser draft.
          </p>
        </section>
        <section className="rounded-panel border border-ink/15 bg-surface p-5">
          <h2 className="m-0 text-xl font-extrabold">
            Privacy or content concern
          </h2>
          <p className="mb-0 mt-2 text-neutral">
            A manual pilot support path will accept correction, review, export,
            and deletion requests after policy ownership is approved.
          </p>
        </section>
      </div>
      <p className="text-sm text-neutral">
        Synthetic contact: pilot-support@example.invalid
      </p>
    </InformationPage>
  );
}
