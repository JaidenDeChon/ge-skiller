export type FeedbackSubmissionType = 'feature-request' | 'bug-report';

export type GitHubTarget = {
    repository: string;
    labels: string[];
    reporter: string;
};

export type FeatureRequestSubmission = {
    submissionType: 'feature-request';
    title: string;
    problemSummary: string;
    proposedSolution: string;
    userImpact: string;
    github: GitHubTarget & {
        discussionCategory: string;
        relatedIssue: string;
    };
};

export type BugReportSubmission = {
    submissionType: 'bug-report';
    title: string;
    severity: string;
    currentRoute: string;
    stepsToReproduce: string;
    expectedBehavior: string;
    actualBehavior: string;
    browserAndVersion: string;
    operatingSystem: string;
    appVersionOrCommit: string;
    github: GitHubTarget & {
        assignees: string[];
        milestone: string;
        projectBoardItem: string;
        reproductionArtifactUrl: string;
    };
};

export type FeedbackSubmissionPayload = FeatureRequestSubmission | BugReportSubmission;

export type FeedbackSubmissionQueueTarget = 'github-discussion' | 'github-issue';

export type FeedbackRateLimitMetadata = {
    cooldownMs: number;
    retryAfterMs: number;
    cooldownExpiresAt: string;
};

export type FeedbackSubmissionResponse = {
    trackingId: string;
    status: 'accepted';
    receivedAt: string;
    submissionType: FeedbackSubmissionType;
    queuedFor: FeedbackSubmissionQueueTarget;
    rateLimit: FeedbackRateLimitMetadata;
};

export type FeedbackSubmissionErrorResponse = {
    error: string;
    code?: string;
    trackingId?: string;
    rateLimit?: FeedbackRateLimitMetadata;
};
