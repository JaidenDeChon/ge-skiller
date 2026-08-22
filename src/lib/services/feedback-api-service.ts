import type {
    FeedbackSubmissionErrorResponse,
    FeedbackSubmissionPayload,
    FeedbackRateLimitMetadata,
    FeedbackSubmissionResponse,
} from '$lib/models/feedback-submission';

const FEEDBACK_API_ENDPOINT = '/api/feedback';

type FeedbackSubmissionApiErrorOptions = {
    status: number;
    code?: string;
    trackingId?: string;
    rateLimit?: FeedbackRateLimitMetadata;
};

export class FeedbackSubmissionApiError extends Error {
    status: number;
    code?: string;
    trackingId?: string;
    rateLimit?: FeedbackRateLimitMetadata;

    constructor(message: string, options: FeedbackSubmissionApiErrorOptions) {
        super(message);
        this.name = 'FeedbackSubmissionApiError';
        this.status = options.status;
        this.code = options.code;
        this.trackingId = options.trackingId;
        this.rateLimit = options.rateLimit;
    }
}

export async function submitFeedbackSubmission(
    payload: FeedbackSubmissionPayload,
): Promise<FeedbackSubmissionResponse> {
    const response = await fetch(FEEDBACK_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    let parsedResponse: FeedbackSubmissionResponse | FeedbackSubmissionErrorResponse | null = null;
    try {
        parsedResponse = (await response.json()) as FeedbackSubmissionResponse | FeedbackSubmissionErrorResponse;
    } catch {
        parsedResponse = null;
    }

    if (!response.ok) {
        const message =
            parsedResponse && 'error' in parsedResponse
                ? parsedResponse.error
                : 'Failed to submit feedback. Please try again.';
        const rateLimit = parsedResponse && 'rateLimit' in parsedResponse ? parsedResponse.rateLimit : undefined;
        throw new FeedbackSubmissionApiError(message, {
            status: response.status,
            code: parsedResponse && 'code' in parsedResponse ? parsedResponse.code : undefined,
            trackingId: parsedResponse && 'trackingId' in parsedResponse ? parsedResponse.trackingId : undefined,
            rateLimit,
        });
    }

    if (!parsedResponse || !('status' in parsedResponse) || parsedResponse.status !== 'accepted') {
        throw new Error('Received an invalid response from feedback API.');
    }

    return parsedResponse;
}
