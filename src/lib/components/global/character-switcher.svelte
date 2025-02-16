<script>
    import * as Sidebar from '$lib/components/ui/sidebar';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Anvil, ChevronsUpDown, Plus } from 'lucide-svelte';

    const sidebar = Sidebar.useSidebar();

    const characters = [
        {
            name: 'roshito',
        },
        {
            name: 'iron-jaiden',
        }
    ];
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger>
        {#snippet child({ props })}
            <Sidebar.MenuButton
                    {...props}
                    size="lg"
                    class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
                <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Anvil />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                                        <span class="truncate font-semibold">
                                            Select Character
                                        </span>
                    <span class="truncate text-xs text-muted-foreground">roshito</span>
                </div>
                <ChevronsUpDown class="ml-auto" />
            </Sidebar.MenuButton>
        {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
            class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
            align="start"
            side={sidebar.isMobile ? 'bottom' : 'right' }
            sideOffset={4}
    >
        <DropdownMenu.Label class="text-muted-foreground text-xs">Characters</DropdownMenu.Label>
        {#each characters as character}
            <DropdownMenu.Item>{character.name}</DropdownMenu.Item>
        {/each}
        <DropdownMenu.Separator />
        <DropdownMenu.Item class="gap-2 p-2">
            <div class="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus class="size-4" />
            </div>
            <span class="text-muted-foreground font-medium">Add character</span>
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>
