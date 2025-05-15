<script lang="ts">
    import { get } from 'svelte/store';
    import { Anvil, ChevronsUpDown, Plus, X } from 'lucide-svelte';
    import { buttonVariants } from '$lib/components/ui/button';
    import { characterStore } from '$lib/stores/character-store';
    import { Button } from '$lib/components/ui/button';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import CharacterStatsDialogButton from '$lib/components/dialogs/character-stats/character-stats-dialog.svelte';

    const sidebar = Sidebar.useSidebar();

    const characters = $derived(get(characterStore).characters);

    const activeCharacter = $derived.by(() => {
        const character = get(characterStore).activeCharacter;
        return characters.find((c) => character === c.id)?.name || 'None selected';
    });

    function removeCharacter(characterName: string): undefined {
        characterStore.update((store) => {
            store.characters = store.characters.filter((c) => c.name !== characterName);
            return store;
        });

        // If the removed character is the active character, or if there are no more characters, remove the active character.
        if (get(characterStore).activeCharacter === characterName || !characters.length) {
            characterStore.update((store) => {
                store.activeCharacter = undefined;
                return store;
            });
        }
        return undefined;
    }
</script>

<DropdownMenu.Root>
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
                    <span class="truncate text-xs text-muted-foreground">{activeCharacter || 'None selected'}</span>
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
            {#each characters as character}
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
                    <Button variant="ghost" size="icon" onclick={removeCharacter(character.name)}>
                        <X />
                    </Button>
                </div>
            {/each}
        </div>

        <DropdownMenu.Separator />

        <!-- "Add character" button -->
        <CharacterStatsDialogButton triggerClass="{buttonVariants({ variant: 'ghost' })} !justify-start">
            {#snippet trigger()}
                <div class="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus class="size-4" />
                </div>
                <span class="text-muted-foreground font-medium">Add character</span>
            {/snippet}
        </CharacterStatsDialogButton>
    </DropdownMenu.Content>
</DropdownMenu.Root>
