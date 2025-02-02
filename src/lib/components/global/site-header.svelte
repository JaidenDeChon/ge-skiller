<script lang="ts">
    import { MediaQuery } from 'svelte/reactivity';
    import { Menu, Sun, Moon } from 'lucide-svelte';
    import { SiGithub } from '@icons-pack/svelte-simple-icons';
    import { toggleMode } from "mode-watcher";
    import { Button, buttonVariants } from '@/components/ui/button';
    import ResponsiveDialog from './responsive-dialog.svelte';

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

        <a href="https://github.com/JaidenDeChon/osrs-ge-skiller-v2" class={['ml-auto w-10 h-10', buttonVariants({ variant: 'ghost'})]}>
            <SiGithub />
            <span class="sr-only">View source on Github</span>
        </a>

        <Button variant="ghost" size="icon" onclick={toggleMode}>
            <Sun class="dark:scale-0" />
            <Moon class="absolute scale-0 dark:scale-100" />
            <span class="sr-only">Toggle theme</span>
        </Button>
    </div>
</header>
