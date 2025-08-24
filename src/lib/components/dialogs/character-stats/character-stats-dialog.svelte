<script lang="ts">
    import { writable } from 'svelte/store';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Tabs from '$lib/components/ui/tabs';
    import { buttonVariants } from '$lib/components/ui/button';
    import CharacterStatsDialogContentManual from '$lib/components/dialogs/character-stats/character-stats-dialog-content-manual.svelte';
    import CharacterStatsDialogContentImport from '$lib/components/dialogs/character-stats/character-stats-dialog-content-import.svelte';

    let open = writable(false);

    let {
        trigger,
        triggerClass = buttonVariants({ variant: 'default' }),
        populateCharacter = '',
        onClose = () => { open.set(false); },
        onCharacterSelected = () => { console.log(('what im a gonna do'))},
    } = $props();
</script>

<Dialog.Root bind:open={$open}>
    <Dialog.Trigger class="w-full {triggerClass}">
        {@render trigger?.()}
    </Dialog.Trigger>

    <Dialog.Content>
        <Dialog.Header>
            <Dialog.Title
                >Skill levels: <span class="text-primary"
                    >{populateCharacter ? populateCharacter : 'New character'}</span
                ></Dialog.Title
            >
            <Dialog.Description>Enter your skills manually or import them from skill trackers.</Dialog.Description>
        </Dialog.Header>

        <Tabs.Root value="manual">
            <Tabs.List class="w-full">
                <Tabs.Trigger class="w-full" value="manual">Manual</Tabs.Trigger>
                <Tabs.Trigger class="w-full" value="import">Import stats</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="manual">
                <CharacterStatsDialogContentManual {populateCharacter} {onClose} {onCharacterSelected} />
            </Tabs.Content>

            <Tabs.Content value="import">
                <CharacterStatsDialogContentImport />
            </Tabs.Content>
        </Tabs.Root>
    </Dialog.Content>
</Dialog.Root>
