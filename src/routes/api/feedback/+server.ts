import { json, type RequestHandler } from '@sveltejs/kit';
import { dispatchFeedbackSubmission, type FeedbackRoutingContext } from '$lib/services/feedback-github-service.server';
import type {
    FeedbackSubmissionErrorResponse,
    FeedbackSubmissionPayload,
    FeedbackRateLimitMetadata,
    FeedbackSubmissionResponse,
} from '$lib/models/feedback-submission';

const MAX_PAYLOAD_BYTES = 25_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_KEYS = 5_000;
const feedbackRateLimitBySource = new Map<string, number>();

/**
 * Feedback ingestion endpoint.
 *
 * TODO(next-security-step):
 * - Verify a captcha token server-side before processing payloads.
 * - Apply strict schema validation and content sanitization for suspicious URLs/scripts.
 * - Persist audit logs (submission metadata + IP) in durable storage.
 */
export const POST: RequestHandler = async ({ request }) => {
    const trackingId = crypto.randomUUID();
    const receivedAt = new Date().toISOString();
    const context: FeedbackRoutingContext = {
        trackingId,
        clientIp: getClientIp(request),
        userAgent: request.headers.get('user-agent')?.trim() || 'unknown',
        receivedAt,
    };
    const now = Date.now();
    const rateLimitKey = getRateLimitKey(context);
    pruneRateLimitEntries(now);

    const activeRateLimit = getActiveRateLimit(rateLimitKey, now);
    if (activeRateLimit) {
        console.info('[feedback-api] submission-rate-limited', {
            trackingId,
            rateLimitKey,
            clientIp: context.clientIp,
            userAgent: context.userAgent,
            retryAfterMs: activeRateLimit.retryAfterMs,
            cooldownExpiresAt: activeRateLimit.cooldownExpiresAt,
        });
        return errorResponse(
            'Please wait before submitting again.',
            429,
            'FEEDBACK_RATE_LIMITED',
            trackingId,
            activeRateLimit,
        );
    }

    const bodyText = await request.text();
    if (!bodyText.trim()) {
        return errorResponse('Missing JSON payload.', 400, 'FEEDBACK_PAYLOAD_MISSING', trackingId);
    }

    if (bodyText.length > MAX_PAYLOAD_BYTES) {
        return errorResponse('Payload is too large.', 413, 'FEEDBACK_PAYLOAD_TOO_LARGE', trackingId);
    }

    let rawPayload: unknown;
    try {
        rawPayload = JSON.parse(bodyText);
    } catch {
        return errorResponse('Invalid JSON payload.', 400, 'FEEDBACK_PAYLOAD_INVALID_JSON', trackingId);
    }

    const parsed = parseFeedbackSubmission(rawPayload);
    if (!parsed.ok) {
        return errorResponse(parsed.error, 400, 'FEEDBACK_PAYLOAD_INVALID', trackingId);
    }

    try {
        const queueResult = await dispatchFeedbackSubmission(parsed.value, context);
        const appliedRateLimit = setSubmissionRateLimit(rateLimitKey, Date.now());

        logFeedbackMetadata({
            trackingId,
            submissionType: parsed.value.submissionType,
            repository: parsed.value.github.repository,
            queuedFor: queueResult.queuedFor,
            rateLimitKey,
            cooldownExpiresAt: appliedRateLimit.cooldownExpiresAt,
            clientIp: context.clientIp,
            userAgent: context.userAgent,
            receivedAt,
        });

        const response: FeedbackSubmissionResponse = {
            trackingId,
            status: 'accepted',
            receivedAt,
            submissionType: parsed.value.submissionType,
            queuedFor: queueResult.queuedFor,
            rateLimit: appliedRateLimit,
        };

        return json(response, { status: 202 });
    } catch (error) {
        console.error('[feedback-api] Failed to route feedback submission', {
            trackingId,
            error,
            submissionType: parsed.value.submissionType,
            repository: parsed.value.github.repository,
        });

        return errorResponse('Failed to process feedback submission.', 500, 'FEEDBACK_ROUTE_FAILED', trackingId);
    }
};

type ParseResult =
    | {
          ok: true;
          value: FeedbackSubmissionPayload;
      }
    | {
          ok: false;
          error: string;
      };

function parseFeedbackSubmission(raw: unknown): ParseResult {
    const record = asObject(raw);
    if (!record) {
        return { ok: false, error: 'Payload must be an object.' };
    }

    const submissionType = normalizeShortText(record.submissionType);
    if (submissionType === 'feature-request') {
        return parseFeatureRequest(record);
    }

    if (submissionType === 'bug-report') {
        return parseBugReport(record);
    }

    return { ok: false, error: 'Unsupported submission type.' };
}

function getRateLimitKey(context: FeedbackRoutingContext): string {
    if (context.clientIp !== 'unknown') {
        return `ip:${context.clientIp}`;
    }

    const normalizedUserAgent = context.userAgent.toLowerCase().slice(0, 120) || 'unknown';
    return `ua:${normalizedUserAgent}`;
}

function getActiveRateLimit(key: string, now: number): FeedbackRateLimitMetadata | null {
    const nextAllowedAt = feedbackRateLimitBySource.get(key);
    if (!nextAllowedAt) return null;

    if (nextAllowedAt <= now) {
        feedbackRateLimitBySource.delete(key);
        return null;
    }

    return buildRateLimitMetadata(nextAllowedAt, now);
}

function setSubmissionRateLimit(key: string, now: number): FeedbackRateLimitMetadata {
    const nextAllowedAt = now + RATE_LIMIT_WINDOW_MS;
    feedbackRateLimitBySource.set(key, nextAllowedAt);
    pruneRateLimitEntries(now);
    return buildRateLimitMetadata(nextAllowedAt, now);
}

function buildRateLimitMetadata(nextAllowedAt: number, now: number): FeedbackRateLimitMetadata {
    return {
        cooldownMs: RATE_LIMIT_WINDOW_MS,
        retryAfterMs: Math.max(0, nextAllowedAt - now),
        cooldownExpiresAt: new Date(nextAllowedAt).toISOString(),
    };
}

function pruneRateLimitEntries(now = Date.now()) {
    for (const [key, nextAllowedAt] of feedbackRateLimitBySource.entries()) {
        if (nextAllowedAt <= now) {
            feedbackRateLimitBySource.delete(key);
        }
    }

    while (feedbackRateLimitBySource.size > MAX_RATE_LIMIT_KEYS) {
        const oldestKey = feedbackRateLimitBySource.keys().next().value as string | undefined;
        if (!oldestKey) break;
        feedbackRateLimitBySource.delete(oldestKey);
    }
}

function parseFeatureRequest(record: Record<string, unknown>): ParseResult {
    const github = asObject(record.github);
    if (!github) {
        return { ok: false, error: 'Feature request payload is missing GitHub fields.' };
    }

    const submission: FeedbackSubmissionPayload = {
        submissionType: 'feature-request',
        title: normalizeShortText(record.title, 140),
        problemSummary: normalizeLongText(record.problemSummary),
        proposedSolution: normalizeLongText(record.proposedSolution),
        userImpact: normalizeLongText(record.userImpact),
        github: {
            repository: normalizeShortText(github.repository),
            discussionCategory: normalizeShortText(github.discussionCategory),
            labels: normalizeStringArray(github.labels),
            relatedIssue: normalizeShortText(github.relatedIssue),
            reporter: normalizeShortText(github.reporter),
        },
    };

    if (!submission.title || !submission.problemSummary) {
        return { ok: false, error: 'Feature request must include title and current problem.' };
    }

    return { ok: true, value: submission };
}

function parseBugReport(record: Record<string, unknown>): ParseResult {
    const github = asObject(record.github);
    if (!github) {
        return { ok: false, error: 'Bug report payload is missing GitHub fields.' };
    }

    const submission: FeedbackSubmissionPayload = {
        submissionType: 'bug-report',
        title: normalizeShortText(record.title, 140),
        severity: normalizeShortText(record.severity),
        currentRoute: normalizeShortText(record.currentRoute),
        stepsToReproduce: normalizeLongText(record.stepsToReproduce),
        expectedBehavior: normalizeLongText(record.expectedBehavior),
        actualBehavior: normalizeLongText(record.actualBehavior),
        browserAndVersion: normalizeShortText(record.browserAndVersion),
        operatingSystem: normalizeShortText(record.operatingSystem),
        appVersionOrCommit: normalizeShortText(record.appVersionOrCommit),
        github: {
            repository: normalizeShortText(github.repository),
            labels: normalizeStringArray(github.labels),
            assignees: normalizeStringArray(github.assignees),
            milestone: normalizeShortText(github.milestone),
            projectBoardItem: normalizeShortText(github.projectBoardItem),
            reproductionArtifactUrl: normalizeShortText(github.reproductionArtifactUrl),
            reporter: normalizeShortText(github.reporter),
        },
    };

    if (
        !submission.title ||
        !submission.stepsToReproduce ||
        !submission.expectedBehavior ||
        !submission.actualBehavior
    ) {
        return {
            ok: false,
            error: 'Bug report must include title, reproduction steps, expected behavior, and actual behavior.',
        };
    }

    return { ok: true, value: submission };
}

function normalizeShortText(value: unknown, maxLength = 240): string {
    if (typeof value !== 'string') return '';
    return value.replaceAll('\u0000', '').trim().slice(0, maxLength);
}

function normalizeLongText(value: unknown, maxLength = 4_000): string {
    if (typeof value !== 'string') return '';
    return value.replaceAll('\u0000', '').trim().slice(0, maxLength);
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    return value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => normalizeShortText(entry, 100))
        .filter(Boolean);
}

function asObject(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
}

function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const firstForwardedIp = forwardedFor.split(',')[0]?.trim();
        if (firstForwardedIp) {
            return firstForwardedIp;
        }
    }

    const cloudflareIp = request.headers.get('cf-connecting-ip')?.trim();
    if (cloudflareIp) return cloudflareIp;

    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;

    return 'unknown';
}

function logFeedbackMetadata(payload: {
    trackingId: string;
    submissionType: FeedbackSubmissionPayload['submissionType'];
    repository: string;
    queuedFor: FeedbackSubmissionResponse['queuedFor'];
    rateLimitKey: string;
    cooldownExpiresAt: string;
    clientIp: string;
    userAgent: string;
    receivedAt: string;
}) {
    console.info('[feedback-api] submission-received', payload);
}

function errorResponse(
    message: string,
    status: number,
    code: string,
    trackingId: string,
    rateLimit?: FeedbackRateLimitMetadata,
) {
    const payload: FeedbackSubmissionErrorResponse = {
        error: message,
        code,
        trackingId,
        rateLimit,
    };

    const headers: HeadersInit = {};
    if (status === 429 && rateLimit) {
        headers['Retry-After'] = String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000)));
    }

    return json(payload, { status, headers });
}
