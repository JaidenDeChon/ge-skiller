import type {
    BugReportSubmission,
    FeatureRequestSubmission,
    FeedbackSubmissionPayload,
    FeedbackSubmissionQueueTarget,
} from '$lib/models/feedback-submission';

export type FeedbackRoutingContext = {
    trackingId: string;
    clientIp: string;
    userAgent: string;
    receivedAt: string;
};

export type FeedbackRoutingResult = {
    queuedFor: FeedbackSubmissionQueueTarget;
    externalReference: string | null;
};

/**
 * Routes normalized feedback submissions into provider-specific handlers.
 *
 * TODO(next-security-step):
 * - Gate this entrypoint behind rate limiting and captcha verification results.
 * - Add strict allowlisting for outbound URLs/repositories.
 */
export async function dispatchFeedbackSubmission(
    submission: FeedbackSubmissionPayload,
    context: FeedbackRoutingContext,
): Promise<FeedbackRoutingResult> {
    if (submission.submissionType === 'feature-request') {
        return queueFeatureRequestSubmission(submission, context);
    }

    return queueBugReportSubmission(submission, context);
}

async function queueFeatureRequestSubmission(
    submission: FeatureRequestSubmission,
    context: FeedbackRoutingContext,
): Promise<FeedbackRoutingResult> {
    const githubToken = getGitHubFeedbackToken();

    // TODO(next step): Submit to GitHub Discussions API using githubToken.
    // This scaffold intentionally keeps secrets server-side and returns a queue acknowledgment only.
    if (!githubToken) {
        // Token is optional during scaffolding; next step will require it for provider submission.
    }

    void submission;
    void context;

    return {
        queuedFor: 'github-discussion',
        externalReference: null,
    };
}

async function queueBugReportSubmission(
    submission: BugReportSubmission,
    context: FeedbackRoutingContext,
): Promise<FeedbackRoutingResult> {
    const githubToken = getGitHubFeedbackToken();

    // TODO(next step): Submit to GitHub Issues API using githubToken.
    // This scaffold intentionally keeps secrets server-side and returns a queue acknowledgment only.
    if (!githubToken) {
        // Token is optional during scaffolding; next step will require it for provider submission.
    }

    void submission;
    void context;

    return {
        queuedFor: 'github-issue',
        externalReference: null,
    };
}

function getGitHubFeedbackToken(): string | null {
    const token = process.env.GITHUB_FEEDBACK_TOKEN?.trim();
    return token ? token : null;
}
