<script lang="ts">
    import { onNavigate } from '$app/navigation';
    import '../app.css';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import { Toaster } from '$lib/components/ui/sonner';
    import NavMenu from '$lib/components/layout/nav-menu/nav-menu.svelte';
    import SiteHeader from '$lib/components/layout/site-header.svelte';
    import { ModeWatcher } from 'mode-watcher';

    let { children, data } = $props();

    const shareTitle = 'GE Skiller: Find the Best OSRS Items to Craft & Profit';
    const shareDescription =
        'Find the best things to make using your skill levels, powered by real-time GE prices on GE Skiller.';
    const shareImageAlt =
        'GE Skiller. Find the best things to make using your skill levels. Powered by real-time GE prices.';
    const baseUrl = $derived(data.baseUrl || 'https://ge-skiller.netlify.app');
    const shareImageUrl = $derived(`${baseUrl}/other-images/share-thumb.png`);

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
    <title>{shareTitle}</title>
    <meta name="description" content={shareDescription} />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="GE Skiller" />
    <meta property="og:title" content={shareTitle} />
    <meta property="og:description" content={shareDescription} />
    <meta property="og:url" content={baseUrl} />
    <meta property="og:image" content={shareImageUrl} />
    <meta property="og:image:alt" content={shareImageAlt} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={shareTitle} />
    <meta name="twitter:description" content={shareDescription} />
    <meta name="twitter:image" content={shareImageUrl} />
    <meta name="twitter:image:alt" content={shareImageAlt} />
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
