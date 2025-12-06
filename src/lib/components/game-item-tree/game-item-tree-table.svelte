<script lang="ts">
    import * as Table from '$lib/components/ui/table';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { GameItemCreationSpecs, IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface GameItemTreeTableProps {
        gameItem: IOsrsboxItemWithMeta | null;
        creationSpec?: GameItemCreationSpecs | null;
    }

    const { gameItem, creationSpec = null }: GameItemTreeTableProps = $props();

    type SkillXpRow = { skillName: string; stepXp: number; totalXp: number };

    const creationSpecs = $derived(
        creationSpec ? [creationSpec] : ((gameItem?.creationSpecs ?? []) as GameItemCreationSpecs[]),
    );
    const xpSummaries = $derived(buildXpSummaries(creationSpecs));

    function formatXp(value: number | null | undefined) {
        if (value === null || value === undefined) return '—';
        return Math.round(value).toLocaleString();
    }

    function buildXpSummaries(specs: GameItemCreationSpecs[]): { id: string; label: string; rows: SkillXpRow[] }[] {
        if (!specs?.length) return [];

        return specs.map((spec, index) => {
            const rows = buildXpRows(spec);
            const label = specs.length === 1 ? 'XP' : `Spec ${index + 1}`;
            return { id: `xp-spec-${index}`, label, rows };
        });
    }

    function buildXpRows(spec: GameItemCreationSpecs): SkillXpRow[] {
        const stepMap = accumulateExperience(spec, 1, false, new Set());
        const totalMap = accumulateExperience(spec, 1, true, new Set());

        const skills = new Set([...stepMap.keys(), ...totalMap.keys()]);
        return Array.from(skills)
            .map((skillName) => ({
                skillName,
                stepXp: stepMap.get(skillName) ?? 0,
                totalXp: totalMap.get(skillName) ?? 0,
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

{#if !xpSummaries.length}
    <p class="text-sm text-muted-foreground p-3">No experience data available.</p>
{:else}
    {#if xpSummaries[0].rows.length}
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>Skill</Table.Head>
                    <Table.Head class="text-end">XP (this step)</Table.Head>
                    <Table.Head class="text-end">XP from scratch</Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each xpSummaries[0].rows as row}
                    <Table.Row>
                        <Table.Cell class="font-medium">{row.skillName}</Table.Cell>
                        <Table.Cell class="text-end">{formatXp(row.stepXp)}</Table.Cell>
                        <Table.Cell class="text-end">{formatXp(row.totalXp)}</Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    {:else}
        <p class="text-sm text-muted-foreground p-3">No experience data available.</p>
    {/if}
{/if}
