type SubmissionState = {
  report_id: string;
  public_id: string;
  report_status: string;
  publication_state: string;
};

export function completedSubmissionResult(submission: SubmissionState) {
  if (
    submission.publication_state !== 'published' &&
    submission.publication_state !== 'rejected'
  ) {
    return null;
  }
  return {
    reportId: submission.report_id,
    publicId: submission.public_id,
    reportStatus: submission.report_status,
    publicationState: submission.publication_state,
    moderation: {
      state:
        submission.publication_state === 'published' ? 'published' : 'rejected',
      retryable: false,
    },
  };
}
