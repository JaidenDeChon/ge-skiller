<script lang="ts">
    import { writable } from 'svelte/store';
    import { toast } from 'svelte-sonner';
    import { Anvil, ChevronsUpDown, Plus, X } from 'lucide-svelte';
    import { buttonVariants } from '$lib/components/ui/button';
    import { getStoreRoot } from '$lib/stores/character-store.svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import CharacterStatsDialogButton from '$lib/components/dialogs/character-stats-dialog.svelte';
    import type { CharacterProfile } from '$lib/models/player-stats';

    const sidebar = Sidebar.useSidebar();

    // Controls whether the character switcher dropdown/popover is open.
    let open = writable(false);

    const store = $derived(getStoreRoot());
    const characterList = $derived(store.characters);

    const activeCharacterName = $derived.by(() => {
        const activeId = store.activeCharacter;
        return store.characters.find((c) => activeId === c.id)?.name || 'None selected';
    });

    /**
     * Remove a character from the character list. If the removed character is the active character, sets the active
     * character to the first character in the list.
     * @param character
     */
    function removeCharacter(character: CharacterProfile): undefined {
        // Compute next list and persist it.
        const next = store.characters.filter((c) => c.id !== character.id);
        store.characters = next;

        toast.info(`Character "${character.name}" has been removed.`);

        // If there are no characters left, clear active and exit.
        if (next.length === 0) {
            store.activeCharacter = undefined;
            return undefined;
        }

        // If the removed character was active, set the first remaining as active.
        if (store.activeCharacter === character.id) {
            store.activeCharacter = next[0]?.id;
            return undefined;
        }
    }

    /**
     * Callback when a character is selected from the dropdown.
     */
    function onCharacterSelected() {
        // Close dropdown/popover when a character is selected.
        open.set(false);
    }
</script>

<DropdownMenu.Root bind:open={$open}>
    <DropdownMenu.Trigger>
        {#snippet child({ props })}
            <Sidebar.MenuButton
                {...props}
                size="lg"
                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
                <div
                    class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                    <Anvil />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">Select Character</span>
                    <span class="truncate text-xs text-muted-foreground">{activeCharacterName}</span>
                </div>
                <ChevronsUpDown class="ml-auto" />
            </Sidebar.MenuButton>
        {/snippet}
    </DropdownMenu.Trigger>

    <DropdownMenu.Content
        class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
        align="start"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        sideOffset={4}
    >
        <DropdownMenu.Label class="text-muted-foreground text-xs">Characters</DropdownMenu.Label>

        <div class="flex flex-col gap-2">
            {#each characterList as character}
                <div class="flex gap-1">
                    <!-- "Add character" button -->
                    <CharacterStatsDialogButton
                        triggerClass="{buttonVariants({ variant: 'ghost' })} !justify-start"
                        populateCharacter={character.name}
                    >
                        {#snippet trigger()}
                            {character.name}
                        {/snippet}
                    </CharacterStatsDialogButton>

                    <!-- Remove character from store's `characters` list. -->
                    <Button variant="ghost" size="icon" onclick={() => removeCharacter(character)}>
                        <X />
                    </Button>
                </div>
            {/each}
        </div>

        <DropdownMenu.Separator />

        <!-- "Add character" button -->
        <CharacterStatsDialogButton
            {onCharacterSelected}
            triggerClass="{buttonVariants({ variant: 'ghost' })} !justify-start"
        >
            {#snippet trigger()}
                <div class="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus class="size-4" />
                </div>
                <span class="text-muted-foreground font-medium">Add character</span>
            {/snippet}
        </CharacterStatsDialogButton>
    </DropdownMenu.Content>
</DropdownMenu.Root>
