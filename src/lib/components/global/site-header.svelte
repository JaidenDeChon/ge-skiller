<script lang="ts">
    import * as Command from '$lib/components/ui/command';
    import ResponsiveDialog from './responsive-dialog.svelte';
    import { MediaQuery } from 'svelte/reactivity';
    import { Menu, Sun, Moon } from 'lucide-svelte';
    import { SiGithub } from '@icons-pack/svelte-simple-icons';
    import { toggleMode } from "mode-watcher";
    import { Button, buttonVariants } from '$lib/components/ui/button';

    const isDesktopMode = $state(new MediaQuery("(min-width: 1024px)"));
</script>

<header class="flex w-full h-16 sticky top-0 border-border border-b custom-bg-blur">
    <div class="content-sizing flex gap-3 items-center">

        {#if !isDesktopMode.current}
            <ResponsiveDialog title="Menu" triggerClass={buttonVariants({ variant: "ghost" })}>
                {#snippet trigger()}
                    <Menu />
                {/snippet}

                {#snippet content()}
                    <p>this is the menu</p>
                {/snippet}
            </ResponsiveDialog>
        {:else}
            <a href="/" aria-label="logo and home link">
                <span class="rs-font text-primary text-xl">osrs-ge-skiller</span>
            </a>
        {/if}

        <!-- Button that looks like search bar -- opens command modal -->
        <ResponsiveDialog
            triggerClass="mx-auto h-10 w-full max-w-72 flex items-center justify-start text-xs text-muted-foreground px-3 py-2 border border-input rounded-md bg-background/45 hover:text-foreground hover:bg-muted/55 transition-colors"
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

        <a
            href="https://github.com/JaidenDeChon/osrs-ge-skiller-v2"
            class={['w-10 min-w-10 h-10', buttonVariants({ variant: 'ghost'})]}
        >
            <SiGithub />
            <span class="sr-only">View source on Github</span>
        </a>

        <Button variant="ghost" size="icon" onclick={toggleMode} class="min-w-10">
            <Sun class="dark:scale-0" />
            <Moon class="absolute scale-0 dark:scale-100" />
            <span class="sr-only">Toggle theme</span>
        </Button>
    </div>
</header>
