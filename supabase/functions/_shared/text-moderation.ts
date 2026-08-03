export type TextModerationDecision = 'approved' | 'escalated' | 'rejected';

export interface TextModerationResult {
  decision: TextModerationDecision;
  code: string;
}

export interface TextModerationAdapter {
  moderate(input: {
    attempt: number;
    description: string;
  }): Promise<TextModerationResult>;
}

export class TextModerationUnavailableError extends Error {
  constructor(
    message = 'No approved semantic text-moderation provider is configured.',
  ) {
    super(message);
    this.name = 'TextModerationUnavailableError';
  }
}

export function createTextModerationAdapter(config: {
  provider: string | undefined;
  runtime: 'local' | 'production';
}): TextModerationAdapter {
  if (config.provider !== 'local-safe-fixture' || config.runtime !== 'local') {
    throw new TextModerationUnavailableError();
  }

  return {
    async moderate({ attempt, description }) {
      if (
        description.includes('Synthetic provider retry fixture') &&
        attempt === 1
      ) {
        throw new TextModerationUnavailableError(
          'The synthetic local moderation provider is temporarily unavailable.',
        );
      }
      if (description.includes('Synthetic review fixture')) {
        return {
          decision: 'escalated',
          code: 'local_review_fixture',
        };
      }
      if (description.includes('Synthetic rejected fixture')) {
        return {
          decision: 'rejected',
          code: 'local_rejected_fixture',
        };
      }
      return {
        decision: 'approved',
        code: description.includes('Synthetic provider retry fixture')
          ? 'local_retry_recovered'
          : 'local_safe_fixture',
      };
    },
  };
}
