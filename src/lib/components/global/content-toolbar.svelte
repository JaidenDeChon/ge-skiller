<script lang="ts">
    import * as Select from '$lib/components/ui/select';
    import { Label } from '$lib/components/ui/label';
    import { Switch } from '$lib/components/ui/switch';

    let selectedSkills = $state([] as string[]);
    const skillsOptions = ['Crafting', 'Fletching', 'Smithing'];
    const skillDropdownTriggerContent = $derived.by(() => {
        switch (selectedSkills.length) {
            case 0:
                return 'Showing all skills';
            case 1:
            case 2:
                return selectedSkills.join(', ');
            default:
                return 'Multiple skills selected';
        }
    });

    let sortValue = $state('');
    const sortOptions = [
        { label: 'Name', value: 'name' },
        { label: 'GE value (high)', value: 'ge-high' },
        { label: 'GE value (low)', value: 'ge-low' },
        { label: 'Alchemy value (high)', value: 'alch-high' },
        { label: 'Alchemy value (low)', value: 'alch-low' },
        { label: 'Skill requirement', value: 'skill' },
    ];
    const sortDropdownTriggerContent = $derived(
        sortOptions.find((sortOption) => sortOption.value === sortValue)?.label ?? 'Sort by...',
    );

    let orderValue = $state('');
    const orderOptions = [
        { label: 'Ascending', value: 'ascending' },
        { label: 'Descending', value: 'descending' },
    ];
    const orderDropdownTriggerContent = $derived(
        orderOptions.find((orderOption) => orderOption.value === orderValue)?.label ?? 'Order by...',
    );
</script>

<div class="border-t border-b">
    <div class="content-sizing flex flex-col gap-3">
        <div class="flex items-center gap-3">
            <Switch id="airplane-mode" />
            <Label for="airplane-mode">Filter by my skill levels</Label>
        </div>

        <div class="flex flex-col gap-3 md:flex-row">
            <Select.Root type="multiple" name="skillSelect" bind:value={selectedSkills}>
                <Select.Trigger>
                    {skillDropdownTriggerContent}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        {#each skillsOptions as skill}
                            <Select.Item value={skill} label={skill}>
                                {skill}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>

            <Select.Root type="single" name="sortSelect" bind:value={sortValue}>
                <Select.Trigger>
                    {sortDropdownTriggerContent}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        {#each sortOptions as sortOpt}
                            <Select.Item value={sortOpt.value} label={sortOpt.label}>
                                {sortOpt.label}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>

            <Select.Root type="single" name="orderSelect" bind:value={orderValue}>
                <Select.Trigger>
                    {orderDropdownTriggerContent}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        {#each orderOptions as orderOpt}
                            <Select.Item value={orderOpt.value} label={orderOpt.label}>
                                {orderOpt.label}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
        </div>
    </div>
</div>
