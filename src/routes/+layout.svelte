<script lang="ts">
    import { onNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import { PUBLIC_SITE_URL } from '$env/static/public';
    import '../app.css';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { Toaster } from '$lib/components/ui/sonner';
    import NavMenu from '$lib/components/layout/nav-menu/nav-menu.svelte';
    import SiteHeader from '$lib/components/layout/site-header.svelte';
    import { ModeWatcher } from 'mode-watcher';

    let { children, data } = $props();

    const shareImagePath = '/other-images/share-thumb.png';
    const normalizedPublicUrl = PUBLIC_SITE_URL?.replace(/\/$/, '');

    onNavigate((navigation) => {
        // Bail early if the browser doesn't support view transitions.
        if (!document.startViewTransition) return;

        return new Promise((resolve) => {
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<svelte:head>
    <meta property="og:image" content={`${normalizedPublicUrl ?? $page.url.origin}${shareImagePath}`} />
    <meta property="og:image:alt" content="GE Skiller share thumbnail" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={`${normalizedPublicUrl ?? $page.url.origin}${shareImagePath}`} />
    <meta name="twitter:image:alt" content="GE Skiller share thumbnail" />
</svelte:head>

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
