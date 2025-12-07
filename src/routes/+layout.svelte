<script lang="ts">
    import { onNavigate } from '$app/navigation';
    import '../app.css';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { Toaster } from '$lib/components/ui/sonner';
    import NavMenu from '$lib/components/layout/nav-menu/nav-menu.svelte';
    import SiteHeader from '$lib/components/layout/site-header.svelte';
    import { ModeWatcher } from 'mode-watcher';

    let { children, data } = $props();

    onNavigate((navigation) => {
        // Bail early if the browser doesn't support view transitions.
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            })
        });
    });
</script>

<Toaster />

<Sidebar.Provider>
    <NavMenu showDevControls={data.showDevControls} />
    <Sidebar.Inset>
        <main class="w-full">
            <SiteHeader />
            {@render children?.()}
        </main>
    </Sidebar.Inset>
</Sidebar.Provider>

<ModeWatcher />

<style>
    :global(div[data-dialog-overlay]) {
        @apply duration-300 !important;
    }
</style>
