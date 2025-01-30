<script lang="ts">
    import { MediaQuery } from 'svelte/reactivity';
    import { Menu, Sun, Moon } from 'lucide-svelte';
    import { SiGithub } from '@icons-pack/svelte-simple-icons';
    import { toggleMode } from "mode-watcher";
    import { Button, buttonVariants } from '@/components/ui/button';
    import ResponsiveDialog from './responsive-dialog.svelte';

    const isDesktopMode = $state(new MediaQuery("(min-width: 1024px)"));
</script>

<header class="flex justify-center items-center sticky top-0 w-full z-50 border-border border-b bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur">
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
        {/if}

        <Button variant="ghost" size="icon" class="ml-auto" href="">
            <SiGithub />
            <span class="sr-only">View source on Github</span>
        </Button>

        <Button variant="ghost" size="icon" onclick={toggleMode}>
            <Sun class="dark:scale-0" />
            <Moon class="absolute scale-0 dark:scale-100" />
            <span class="sr-only">Toggle theme</span>
        </Button>
    </div>
</header>
