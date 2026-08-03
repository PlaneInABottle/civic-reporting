import type { Metadata } from 'next';
import { InformationPage } from '@/components/information-page';

export const metadata: Metadata = {
  title: 'Accessibility',
};

export default function AccessibilityPage() {
  return (
    <InformationPage
      eyebrow="Access for everyone"
      summary="The pilot targets WCAG 2.2 AA and treats the map as an optional enhancement."
      title="Accessibility"
    >
      <section>
        <h2 className="text-xl font-extrabold">
          Complete non-map reporting path
        </h2>
        <p className="max-w-prose text-neutral">
          Enter a place, street, and area with labeled fields; choose a matching
          result from a normal list; review the public location precision; and
          complete every report step without interacting with a map canvas.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-extrabold">
          Keyboard and assistive technology
        </h2>
        <p className="max-w-prose text-neutral">
          Skip links, visible focus, semantic landmarks, descriptive status
          text, error summaries, and focus restoration are part of the
          acceptance contract. Automated checks supplement—not replace—manual
          review.
        </p>
      </section>
      <section className="rounded-panel border border-attention/40 bg-warning-bg p-5">
        <h2 className="m-0 text-xl font-extrabold">Pilot limitation</h2>
        <p className="mb-0 mt-2 text-neutral">
          Manual NVDA, VoiceOver, high-contrast, 200% text, and representative
          disabled-user acceptance remain launch blockers until named reviewers
          complete them.
        </p>
      </section>
    </InformationPage>
  );
}
