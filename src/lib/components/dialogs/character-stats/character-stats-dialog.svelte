<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Tabs from '$lib/components/ui/tabs';
    import { buttonVariants } from '$lib/components/ui/button';
    import CharacterStatsDialogContentManual from '$lib/components/dialogs/character-stats/character-stats-dialog-content-manual.svelte';
    import CharacterStatsDialogContentImport from '$lib/components/dialogs/character-stats/character-stats-dialog-content-import.svelte';

    const dialogTitle = 'Enter your skill levels';
</script>

<Dialog.Root>
    <Dialog.Trigger class={buttonVariants({ variant: 'default' })}>
        <img src="/skill-images/skills.png" alt="OSRS skills icon" class="w-6 h-6" />
        <span class="rs-font text-xl">{dialogTitle}</span>
    </Dialog.Trigger>

    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title>{dialogTitle}</Dialog.Title>
            <Dialog.Description>Enter your skills manually or import them from skill trackers.</Dialog.Description>
        </Dialog.Header>

        <Tabs.Root value="manual">
            <Tabs.List class="w-full">
                <Tabs.Trigger class="w-full" value="manual">Manual</Tabs.Trigger>
                <Tabs.Trigger class="w-full" value="import">Import stats</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="manual">
                <CharacterStatsDialogContentManual />
            </Tabs.Content>

            <Tabs.Content value="import">
                <CharacterStatsDialogContentImport />
            </Tabs.Content>
        </Tabs.Root>
    </Dialog.Content>
</Dialog.Root>
