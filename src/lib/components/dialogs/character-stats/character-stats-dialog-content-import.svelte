<script lang="ts">
    import Button from '$lib/components/ui/button/button.svelte';
    import Input from '$lib/components/ui/input/input.svelte';
    import Label from '$lib/components/ui/label/label.svelte';
    import * as Select from '$lib/components/ui/select';
    import { Footer } from '$lib/components/ui/dialog';

    // Svelte still ins't super happy about putting enums in <script> so we'll just do this instead
    const Services = {
        WISE_OLD_MAN: 'Wise Old Man',
    } as const;

    let name = $state('');
    let value = $state<string | undefined>(Services.WISE_OLD_MAN);

    async function fetchCharacterStats(): Promise<void> {
        Promise.resolve();
    }
</script>

<div class="flex flex-col gap-3 h-[44vh]">
    <div>
        <Label class="capitalize text-xs" for="character-name">Character name</Label>
        <Input id="character-name" type="text" required aria-required bind:value={name} />
    </div>

    <div>
        <Label class="capitalize text-xs">Select service</Label>
        <Select.Root type="single" name="serviceSelection" bind:value>
            <Select.Trigger></Select.Trigger>
            <Select.Content>
                <Select.Group>
                    {#each Object.values(Services) as service}
                        <Select.Item value={service} label={service}>{service}</Select.Item>
                    {/each}
                </Select.Group>
            </Select.Content>
        </Select.Root>
    </div>

    <Footer class="px-4 pb-4 lg:px-0 mt-auto">
        <Button type="submit" onclick={fetchCharacterStats}>Submit</Button>
    </Footer>
</div>
