<script lang="ts">
    import * as Command from '$lib/components/ui/command';
    import ResponsiveDialog from './responsive-dialog.svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import { buttonVariants } from '$lib/components/ui/button';
    import * as Sidebar from '$lib/components/ui/sidebar';

    const isDesktopMode = $state(new MediaQuery("(min-width: 1024px)"));
</script>

<header class="flex w-full h-16 sticky top-0 border-border border-b custom-bg-blur">
    <div class="content-sizing p-4 w-full flex gap-3 items-center">

        <Sidebar.Trigger
                class={buttonVariants({class: 'h-10 w-10 min-h-10 min-w-10 text-foreground border border-input rounded-md bg-background/70 hover:bg-muted/55 transition-colors'})}
        />

        {#if isDesktopMode.current}
            <a href="/" aria-label="logo and home link">
                <span class="rs-font-with-shadow text-primary text-xl">osrs-skillionaire</span>
            </a>
        {/if}

        <!-- Button that looks like search bar; opens command modal. -->
        <ResponsiveDialog
            triggerClass="mx-auto h-10 w-full max-w-72 flex items-center justify-start text-xs text-muted-foreground px-3 py-2 border border-input rounded-md bg-background/70 hover:text-foreground hover:bg-muted/55 transition-colors"
            contentClass="p-0"
        >
            {#snippet trigger()}
                Search...
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
