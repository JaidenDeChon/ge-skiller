<script lang="ts">
    import { toast } from 'svelte-sonner';
    import type { Snippet } from 'svelte';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Tabs from '$lib/components/ui/tabs';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { FeedbackSubmissionApiError, submitFeedbackSubmission } from '$lib/services/feedback-api-service';
    import type {
        BugReportSubmission,
        FeatureRequestSubmission,
        FeedbackRateLimitMetadata,
    } from '$lib/models/feedback-submission';

    type TriggerSnippet = Snippet<[{ openDialog: () => void; triggerClass: string }]>;

    type FeatureRequestForm = {
        title: string;
        problemSummary: string;
        proposedSolution: string;
        userImpact: string;
        githubRepository: string;
        discussionCategory: string;
        labels: string;
        relatedIssue: string;
        githubHandle: string;
    };

    type BugReportForm = {
        title: string;
        severity: string;
        currentRoute: string;
        stepsToReproduce: string;
        expectedBehavior: string;
        actualBehavior: string;
        browserAndVersion: string;
        operatingSystem: string;
        appVersionOrCommit: string;
        githubRepository: string;
        labels: string;
        assignees: string;
        milestone: string;
        projectBoardItem: string;
        reproductionArtifactUrl: string;
        githubHandle: string;
    };

    type FeedbackTab = 'feature-request' | 'bug-report';

    const FIELD_LIMITS = {
        title: 140,
        shortText: 240,
        longText: 4000,
        csvText: 300,
    } as const;

    const featureDefaults: FeatureRequestForm = {
        title: '',
        problemSummary: '',
        proposedSolution: '',
        userImpact: '',
        githubRepository: 'JaidenDeChon/ge-skiller',
        discussionCategory: 'feature-ideas',
        labels: 'enhancement, feedback',
        relatedIssue: '',
        githubHandle: '',
    };

    const bugDefaults: BugReportForm = {
        title: '',
        severity: 'normal',
        currentRoute: '',
        stepsToReproduce: '',
        expectedBehavior: '',
        actualBehavior: '',
        browserAndVersion: '',
        operatingSystem: '',
        appVersionOrCommit: '',
        githubRepository: 'JaidenDeChon/ge-skiller',
        labels: 'bug, triage',
        assignees: '',
        milestone: '',
        projectBoardItem: '',
        reproductionArtifactUrl: '',
        githubHandle: '',
    };

    let {
        trigger,
        triggerClass = buttonVariants({
            variant: 'outline',
            class: 'w-full justify-center',
        }),
    }: { trigger?: TriggerSnippet; triggerClass?: string } = $props();

    let open = $state(false);
    let activeTab = $state<FeedbackTab>('feature-request');
    let featureRequest = $state<FeatureRequestForm>(structuredClone(featureDefaults));
    let bugReport = $state<BugReportForm>(structuredClone(bugDefaults));
    let isSubmittingFeature = $state(false);
    let isSubmittingBug = $state(false);
    let cooldownEndsAtMs = $state<number | null>(null);
    let nowMs = $state(Date.now());

    const textareaClass =
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    const cooldownRemainingMs = $derived(cooldownEndsAtMs ? Math.max(0, cooldownEndsAtMs - nowMs) : 0);
    const isCooldownActive = $derived(cooldownRemainingMs > 0);
    const cooldownCountdownLabel = $derived(isCooldownActive ? `Disabled for ${formatCooldown(cooldownRemainingMs)}` : '');

    $effect(() => {
        if (!cooldownEndsAtMs) return;

        const initialNow = Date.now();
        if (cooldownEndsAtMs <= initialNow) {
            cooldownEndsAtMs = null;
            nowMs = initialNow;
            return;
        }

        nowMs = initialNow;
        const interval = setInterval(() => {
            const tickNow = Date.now();
            nowMs = tickNow;

            if (cooldownEndsAtMs && cooldownEndsAtMs <= tickNow) {
                cooldownEndsAtMs = null;
            }
        }, 1000);

        return () => clearInterval(interval);
    });

    function openDialog() {
        open = true;
    }

    function resetFeatureForm() {
        featureRequest = structuredClone(featureDefaults);
    }

    function resetBugForm() {
        bugReport = structuredClone(bugDefaults);
    }

    function normalizeValue(value: string, maxLength: number): string {
        return value.replaceAll('\u0000', '').trim().slice(0, maxLength);
    }

    function splitCsvValues(value: string): string[] {
        return normalizeValue(value, FIELD_LIMITS.csvText)
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }

    function getRateLimitExpiryMs(rateLimit?: FeedbackRateLimitMetadata): number | null {
        if (!rateLimit) return null;

        const expiresAtFromIso = Date.parse(rateLimit.cooldownExpiresAt);
        if (Number.isFinite(expiresAtFromIso)) return expiresAtFromIso;

        if (Number.isFinite(rateLimit.retryAfterMs)) {
            return Date.now() + Math.max(0, rateLimit.retryAfterMs);
        }

        return null;
    }

    function applyRateLimitCooldown(rateLimit?: FeedbackRateLimitMetadata) {
        const expiresAt = getRateLimitExpiryMs(rateLimit);
        if (!expiresAt) return;

        cooldownEndsAtMs = Math.max(cooldownEndsAtMs ?? 0, expiresAt);
        nowMs = Date.now();
    }

    function formatCooldown(milliseconds: number): string {
        const totalSeconds = Math.max(1, Math.ceil(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    async function handleFeatureRequestSubmit(event: SubmitEvent) {
        event.preventDefault();

        if (isCooldownActive) {
            toast.error(`Please wait ${formatCooldown(cooldownRemainingMs)} before submitting again.`);
            return;
        }

        const payload: FeatureRequestSubmission = {
            submissionType: 'feature-request',
            title: normalizeValue(featureRequest.title, FIELD_LIMITS.title),
            problemSummary: normalizeValue(featureRequest.problemSummary, FIELD_LIMITS.longText),
            proposedSolution: normalizeValue(featureRequest.proposedSolution, FIELD_LIMITS.longText),
            userImpact: normalizeValue(featureRequest.userImpact, FIELD_LIMITS.longText),
            github: {
                repository: normalizeValue(featureRequest.githubRepository, FIELD_LIMITS.shortText),
                discussionCategory: normalizeValue(featureRequest.discussionCategory, FIELD_LIMITS.shortText),
                labels: splitCsvValues(featureRequest.labels),
                relatedIssue: normalizeValue(featureRequest.relatedIssue, FIELD_LIMITS.shortText),
                reporter: normalizeValue(featureRequest.githubHandle, FIELD_LIMITS.shortText),
            },
        };

        // TODO(security): Add authenticated submission, strict server-side schema validation, and CSRF protection.
        if (!payload.title || !payload.problemSummary) {
            toast.error('Please provide a title and summary before submitting.');
            return;
        }

        isSubmittingFeature = true;

        try {
            const response = await submitFeedbackSubmission(payload);
            applyRateLimitCooldown(response.rateLimit);
            toast.success(`Feature request queued (${response.trackingId.slice(0, 8)}).`);
            resetFeatureForm();
            open = false;
        } catch (error) {
            if (error instanceof FeedbackSubmissionApiError) {
                applyRateLimitCooldown(error.rateLimit);
                toast.error(error.message);
            } else {
                toast.error(error instanceof Error ? error.message : 'Failed to submit feature request.');
            }
        } finally {
            isSubmittingFeature = false;
        }
    }

    async function handleBugReportSubmit(event: SubmitEvent) {
        event.preventDefault();

        if (isCooldownActive) {
            toast.error(`Please wait ${formatCooldown(cooldownRemainingMs)} before submitting again.`);
            return;
        }

        const payload: BugReportSubmission = {
            submissionType: 'bug-report',
            title: normalizeValue(bugReport.title, FIELD_LIMITS.title),
            severity: normalizeValue(bugReport.severity, FIELD_LIMITS.shortText),
            currentRoute: normalizeValue(bugReport.currentRoute, FIELD_LIMITS.shortText),
            stepsToReproduce: normalizeValue(bugReport.stepsToReproduce, FIELD_LIMITS.longText),
            expectedBehavior: normalizeValue(bugReport.expectedBehavior, FIELD_LIMITS.longText),
            actualBehavior: normalizeValue(bugReport.actualBehavior, FIELD_LIMITS.longText),
            browserAndVersion: normalizeValue(bugReport.browserAndVersion, FIELD_LIMITS.shortText),
            operatingSystem: normalizeValue(bugReport.operatingSystem, FIELD_LIMITS.shortText),
            appVersionOrCommit: normalizeValue(bugReport.appVersionOrCommit, FIELD_LIMITS.shortText),
            github: {
                repository: normalizeValue(bugReport.githubRepository, FIELD_LIMITS.shortText),
                labels: splitCsvValues(bugReport.labels),
                assignees: splitCsvValues(bugReport.assignees),
                milestone: normalizeValue(bugReport.milestone, FIELD_LIMITS.shortText),
                projectBoardItem: normalizeValue(bugReport.projectBoardItem, FIELD_LIMITS.shortText),
                reproductionArtifactUrl: normalizeValue(bugReport.reproductionArtifactUrl, FIELD_LIMITS.shortText),
                reporter: normalizeValue(bugReport.githubHandle, FIELD_LIMITS.shortText),
            },
        };

        // TODO(security): Add authenticated submission, strict server-side schema validation, and CSRF protection.
        if (!payload.title || !payload.stepsToReproduce || !payload.expectedBehavior || !payload.actualBehavior) {
            toast.error('Please complete the required bug report fields before submitting.');
            return;
        }

        isSubmittingBug = true;

        try {
            const response = await submitFeedbackSubmission(payload);
            applyRateLimitCooldown(response.rateLimit);
            toast.success(`Bug report queued (${response.trackingId.slice(0, 8)}).`);
            resetBugForm();
            open = false;
        } catch (error) {
            if (error instanceof FeedbackSubmissionApiError) {
                applyRateLimitCooldown(error.rateLimit);
                toast.error(error.message);
            } else {
                toast.error(error instanceof Error ? error.message : 'Failed to submit bug report.');
            }
        } finally {
            isSubmittingBug = false;
        }
    }
</script>

<Dialog.Root bind:open>
    {#if trigger}
        {@render trigger({ openDialog, triggerClass })}
    {:else}
        <Dialog.Trigger class={triggerClass}>Report feedback</Dialog.Trigger>
    {/if}

    <Dialog.Content class="max-h-[90vh] w-[96vw] max-w-4xl overflow-hidden p-0">
        <Dialog.Header class="border-b px-6 py-5">
            <Dialog.Title>Feedback hub</Dialog.Title>
            <Dialog.Description>
                Send feature ideas and bugs using GitHub-ready fields so we can wire this into Issues and Discussions.
            </Dialog.Description>
        </Dialog.Header>

        <Tabs.Root value={activeTab} onValueChange={(value) => (activeTab = value as FeedbackTab)}>
            <div class="px-6 pt-4">
                <Tabs.List class="grid h-auto w-full grid-cols-2">
                    <Tabs.Trigger value="feature-request" class="py-2">Feature requests</Tabs.Trigger>
                    <Tabs.Trigger value="bug-report" class="py-2">Bug reports</Tabs.Trigger>
                </Tabs.List>
            </div>

            <Tabs.Content value="feature-request" class="mt-0">
                <form class="flex max-h-[68vh] flex-col" onsubmit={handleFeatureRequestSubmit}>
                    <div class="space-y-6 overflow-y-auto px-6 py-4">
                        <section class="space-y-3">
                            <h3 class="text-sm font-semibold">Feature details</h3>
                            <div class="space-y-2">
                                <Label for="feature-title">Feature title *</Label>
                                <Input
                                    id="feature-title"
                                    maxlength={FIELD_LIMITS.title}
                                    required
                                    bind:value={featureRequest.title}
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="feature-problem-summary">Current problem *</Label>
                                <textarea
                                    id="feature-problem-summary"
                                    class={textareaClass}
                                    maxlength={FIELD_LIMITS.longText}
                                    required
                                    bind:value={featureRequest.problemSummary}
                                ></textarea>
                            </div>
                            <div class="space-y-2">
                                <Label for="feature-proposed-solution">Proposed solution</Label>
                                <textarea
                                    id="feature-proposed-solution"
                                    class={textareaClass}
                                    maxlength={FIELD_LIMITS.longText}
                                    bind:value={featureRequest.proposedSolution}
                                ></textarea>
                            </div>
                            <div class="space-y-2">
                                <Label for="feature-user-impact">Who benefits / impact</Label>
                                <textarea
                                    id="feature-user-impact"
                                    class={textareaClass}
                                    maxlength={FIELD_LIMITS.longText}
                                    bind:value={featureRequest.userImpact}
                                ></textarea>
                            </div>
                        </section>

                        <section class="space-y-3">
                            <h3 class="text-sm font-semibold">GitHub discussions mapping</h3>
                            <div class="grid gap-4 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="feature-github-repo">Repository</Label>
                                    <Input
                                        id="feature-github-repo"
                                        maxlength={FIELD_LIMITS.shortText}
                                        bind:value={featureRequest.githubRepository}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="feature-discussion-category">Discussion category</Label>
                                    <Input
                                        id="feature-discussion-category"
                                        maxlength={FIELD_LIMITS.shortText}
                                        bind:value={featureRequest.discussionCategory}
                                    />
                                </div>
                            </div>
                            <div class="grid gap-4 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="feature-labels">Labels (comma-separated)</Label>
                                    <Input
                                        id="feature-labels"
                                        maxlength={FIELD_LIMITS.csvText}
                                        bind:value={featureRequest.labels}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="feature-related-issue">Related issue / discussion URL</Label>
                                    <Input
                                        id="feature-related-issue"
                                        maxlength={FIELD_LIMITS.shortText}
                                        bind:value={featureRequest.relatedIssue}
                                    />
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label for="feature-github-handle">GitHub handle</Label>
                                <Input
                                    id="feature-github-handle"
                                    maxlength={FIELD_LIMITS.shortText}
                                    placeholder="@username"
                                    bind:value={featureRequest.githubHandle}
                                />
                            </div>
                        </section>
                    </div>

                    <Dialog.Footer class="gap-2 border-t px-6 py-4 sm:justify-between">
                        <Button type="button" variant="ghost" onclick={resetFeatureForm} disabled={isSubmittingFeature}>
                            Clear feature draft
                        </Button>
                        <Button type="submit" disabled={isSubmittingFeature || isCooldownActive}>
                            {isSubmittingFeature
                                ? 'Queueing...'
                                : isCooldownActive
                                  ? cooldownCountdownLabel
                                  : 'Queue feature request'}
                        </Button>
                    </Dialog.Footer>
                </form>
            </Tabs.Content>

            <Tabs.Content value="bug-report" class="mt-0">
                <form class="flex max-h-[68vh] flex-col" onsubmit={handleBugReportSubmit}>
                    <div class="space-y-6 overflow-y-auto px-6 py-4">
                        <section class="space-y-3">
                            <h3 class="text-sm font-semibold">Bug details</h3>
                            <div class="grid gap-4 md:grid-cols-2">
                                <div class="space-y-2 md:col-span-2">
                                    <Label for="bug-title">Bug title *</Label>
                                    <Input
                                        id="bug-title"
                                        maxlength={FIELD_LIMITS.title}
                                        required
                                        bind:value={bugReport.title}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-severity">Severity</Label>
                                    <select
                                        id="bug-severity"
                                        class="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                        bind:value={bugReport.severity}
                                    >
                                        <option value="critical">Critical</option>
                                        <option value="high">High</option>
                                        <option value="normal">Normal</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-current-route">Page / route</Label>
                                    <Input
                                        id="bug-current-route"
                                        maxlength={FIELD_LIMITS.shortText}
                                        placeholder="/items/123"
                                        bind:value={bugReport.currentRoute}
                                    />
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label for="bug-steps">Steps to reproduce *</Label>
                                <textarea
                                    id="bug-steps"
                                    class={textareaClass}
                                    maxlength={FIELD_LIMITS.longText}
                                    required
                                    bind:value={bugReport.stepsToReproduce}
                                ></textarea>
                            </div>
                            <div class="grid gap-4 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="bug-expected">Expected behavior *</Label>
                                    <textarea
                                        id="bug-expected"
                                        class={textareaClass}
                                        maxlength={FIELD_LIMITS.longText}
                                        required
                                        bind:value={bugReport.expectedBehavior}
                                    ></textarea>
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-actual">Actual behavior *</Label>
                                    <textarea
                                        id="bug-actual"
                                        class={textareaClass}
                                        maxlength={FIELD_LIMITS.longText}
                                        required
                                        bind:value={bugReport.actualBehavior}
                                    ></textarea>
                                </div>
                            </div>
                        </section>

                        <section class="space-y-3">
                            <h3 class="text-sm font-semibold">Environment</h3>
                            <div class="grid gap-4 md:grid-cols-3">
                                <div class="space-y-2">
                                    <Label for="bug-browser-version">Browser + version</Label>
                                    <Input
                                        id="bug-browser-version"
                                        maxlength={FIELD_LIMITS.shortText}
                                        placeholder="Chrome 133"
                                        bind:value={bugReport.browserAndVersion}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-operating-system">OS / device</Label>
                                    <Input
                                        id="bug-operating-system"
                                        maxlength={FIELD_LIMITS.shortText}
                                        placeholder="macOS 15 / iPhone 16"
                                        bind:value={bugReport.operatingSystem}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-app-version">Build / commit</Label>
                                    <Input
                                        id="bug-app-version"
                                        maxlength={FIELD_LIMITS.shortText}
                                        placeholder="main@abcdef1"
                                        bind:value={bugReport.appVersionOrCommit}
                                    />
                                </div>
                            </div>
                        </section>

                        <section class="space-y-3">
                            <h3 class="text-sm font-semibold">GitHub issue mapping</h3>
                            <div class="grid gap-4 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="bug-github-repo">Repository</Label>
                                    <Input
                                        id="bug-github-repo"
                                        maxlength={FIELD_LIMITS.shortText}
                                        bind:value={bugReport.githubRepository}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-labels">Labels (comma-separated)</Label>
                                    <Input
                                        id="bug-labels"
                                        maxlength={FIELD_LIMITS.csvText}
                                        bind:value={bugReport.labels}
                                    />
                                </div>
                            </div>
                            <div class="grid gap-4 md:grid-cols-3">
                                <div class="space-y-2">
                                    <Label for="bug-assignees">Assignees</Label>
                                    <Input
                                        id="bug-assignees"
                                        maxlength={FIELD_LIMITS.csvText}
                                        placeholder="jaiden, maintainer"
                                        bind:value={bugReport.assignees}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-milestone">Milestone</Label>
                                    <Input
                                        id="bug-milestone"
                                        maxlength={FIELD_LIMITS.shortText}
                                        bind:value={bugReport.milestone}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-project-board">Project board item</Label>
                                    <Input
                                        id="bug-project-board"
                                        maxlength={FIELD_LIMITS.shortText}
                                        bind:value={bugReport.projectBoardItem}
                                    />
                                </div>
                            </div>
                            <div class="grid gap-4 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="bug-repro-artifact">Reproduction artifact URL</Label>
                                    <Input
                                        id="bug-repro-artifact"
                                        maxlength={FIELD_LIMITS.shortText}
                                        placeholder="https://..."
                                        bind:value={bugReport.reproductionArtifactUrl}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="bug-github-handle">GitHub handle</Label>
                                    <Input
                                        id="bug-github-handle"
                                        maxlength={FIELD_LIMITS.shortText}
                                        placeholder="@username"
                                        bind:value={bugReport.githubHandle}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <Dialog.Footer class="gap-2 border-t px-6 py-4 sm:justify-between">
                        <Button type="button" variant="ghost" onclick={resetBugForm} disabled={isSubmittingBug}>
                            Clear bug draft
                        </Button>
                        <Button type="submit" disabled={isSubmittingBug || isCooldownActive}>
                            {isSubmittingBug
                                ? 'Queueing...'
                                : isCooldownActive
                                  ? cooldownCountdownLabel
                                  : 'Queue bug report'}
                        </Button>
                    </Dialog.Footer>
                </form>
            </Tabs.Content>
        </Tabs.Root>

        <div class="border-t px-6 py-3 text-xs text-muted-foreground">
            Security hardening is intentionally deferred for now. Next step: authenticated submit, strict schema
            validation, anti-spam controls, and audit logging.
        </div>
    </Dialog.Content>
</Dialog.Root>
