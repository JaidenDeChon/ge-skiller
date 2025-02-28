<script lang="ts">
    import ResponsiveDialog from '../global/responsive-dialog.svelte';
    import * as Command from '$lib/components/ui/command';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { MediaQuery } from 'svelte/reactivity';
    import { buttonVariants } from '$lib/components/ui/button';
    import { Search } from 'lucide-svelte';

    const isDesktopMode = $state(new MediaQuery('(min-width: 1024px)'));
</script>

<header class="flex w-full h-16 sticky top-0 border-border border-b custom-bg-blur z-30">
    <div class="py-4 px-8 w-full flex gap-3 items-center">
        <Sidebar.Trigger
            class={buttonVariants({
                class: 'h-10 w-10 min-h-10 min-w-10 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors',
            })}
        />

        <a href="/" aria-label="logo and home link">
            <span class="rs-font-with-shadow text-primary text-xl">ge-skiller</span>
        </a>

        <!-- Button that looks like search bar; opens command modal. -->
        <ResponsiveDialog
            triggerClass="h-10 w-10 ml-auto flex items-center justify-start text-xs text-muted-foreground p-3 border border-input rounded-md bg-background/70 hover:text-foreground hover:bg-muted/55 transition-colors lg:w-full lg:ml-0 lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:max-w-72"
            contentClass="p-0"
        >
            {#snippet trigger()}
                <Search class="h-4 w-4" />
                <span class="text-muted-foreground ml-3 hidden lg:block">Search...</span>
            {/snippet}

            {#snippet content()}
                <Command.Root class="w-full rounded-lg border">
                    <Command.Input placeholder="Search..." />
                    <Command.List>
                        <Command.Empty>No results found.</Command.Empty>
                    </Command.List>
                    <Command.Group heading="Recent items">
                        <Command.Item>Leather cowl</Command.Item>
                        <Command.Item>Iron Platebody</Command.Item>
                    </Command.Group>
                </Command.Root>
            {/snippet}
        </ResponsiveDialog>
    </div>
</header>
