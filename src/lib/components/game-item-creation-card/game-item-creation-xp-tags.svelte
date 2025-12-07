<script lang="ts">
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { GameItemCreationSpecs, IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface GameItemCreationXpTagsProps {
        gameItem: IOsrsboxItemWithMeta | null;
        creationSpec?: GameItemCreationSpecs | null;
    }

    const { gameItem, creationSpec = null }: GameItemCreationXpTagsProps = $props();

    type SkillXpRow = { skillName: string; stepXp: number; totalXp: number; level?: number };

    const creationSpecs = $derived(
        creationSpec ? [creationSpec] : ((gameItem?.creationSpecs ?? []) as GameItemCreationSpecs[]),
    );
    const xpSummaries = $derived(buildXpSummaries(creationSpecs));
    const rows = $derived(xpSummaries[0]?.rows ?? []);
    const requiredLevels = $derived(xpSummaries[0]?.requiredLevels ?? {});

    function formatXp(value: number | null | undefined) {
        if (value === null || value === undefined) return '—';
        return Math.round(value).toLocaleString();
    }

    function buildXpSummaries(
        specs: GameItemCreationSpecs[],
    ): { id: string; label: string; rows: SkillXpRow[]; requiredLevels: Record<string, number> }[] {
        if (!specs?.length) return [];

        return specs.map((spec, index) => {
            const requiredLevels = buildRequiredLevels(spec);
            const rows = buildXpRows(spec, requiredLevels);
            const label = specs.length === 1 ? 'XP' : `Spec ${index + 1}`;
            return { id: `xp-spec-${index}`, label, rows, requiredLevels };
        });
    }

    function buildRequiredLevels(spec: GameItemCreationSpecs): Record<string, number> {
        return Object.fromEntries(
            (spec.requiredSkills ?? [])
                .filter((req) => req?.skillName && typeof req.skillLevel === 'number')
                .map((req) => [req.skillName.toLowerCase(), req.skillLevel ?? 0]),
        );
    }

    function buildXpRows(spec: GameItemCreationSpecs, requiredLevels: Record<string, number>): SkillXpRow[] {
        const stepMap = accumulateExperience(spec, 1, false, new Set());
        const totalMap = accumulateExperience(spec, 1, true, new Set());

        const skills = new Set([...stepMap.keys(), ...totalMap.keys(), ...Object.keys(requiredLevels)]);
        return Array.from(skills)
            .map((skillName) => ({
                skillName,
                stepXp: stepMap.get(skillName) ?? 0,
                totalXp: totalMap.get(skillName) ?? 0,
                level: requiredLevels[skillName.toLowerCase()],
            }))
            .sort((a, b) => b.totalXp - a.totalXp);
    }

    function accumulateExperience(
        spec: GameItemCreationSpecs,
        multiplier: number,
        includeChildren: boolean,
        visited: Set<string | number>,
    ): Map<string, number> {
        const map = new Map<string, number>();

        for (const xp of spec.experienceGranted ?? []) {
            if (!xp?.skillName || xp.experienceAmount === undefined || xp.experienceAmount === null) continue;
            const key = xp.skillName;
            const amount = xp.experienceAmount * multiplier;
            map.set(key, (map.get(key) ?? 0) + amount);
        }

        if (!includeChildren) return map;

        for (const ingredient of spec.ingredients ?? []) {
            if (!ingredient?.item) continue;
            if (ingredient.consumedDuringCreation === false) continue;

            const amount = ingredient.amount ?? 1;
            const childItem = ingredient.item as IOsrsboxItemWithMeta | undefined;
            const childId = childItem?.id ?? null;
            if (childId !== null) {
                if (visited.has(childId)) continue;
                visited.add(childId);
            }

            const childSpec = getPrimaryCreationSpec(childItem);
            if (childSpec) {
                const childMap = accumulateExperience(childSpec, multiplier * amount, true, visited);
                for (const [skill, value] of childMap.entries()) {
                    map.set(skill, (map.get(skill) ?? 0) + value);
                }
            }

            if (childId !== null) visited.delete(childId);
        }

        return map;
    }
</script>

{#if !rows.length}
    <p class="text-sm text-muted-foreground p-3">No experience data available.</p>
{:else}
    <div class="flex flex-wrap gap-2 p-3">
        {#each rows as row}
            <span class="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-semibold">
                <span class="text-foreground">
                    {#if row.level}{row.level} {/if} {row.skillName}
                </span>
                <span class="text-muted-foreground">Step: {formatXp(row.stepXp)}</span>
                <span class="text-primary font-bold">Total: {formatXp(row.totalXp)}</span>
            </span>
        {/each}
    </div>
{/if}
