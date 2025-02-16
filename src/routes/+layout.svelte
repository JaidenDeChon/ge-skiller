<script lang="ts">
	import '../app.css';
    import { ModeWatcher } from 'mode-watcher';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import NavMenu from '$lib/components/global/nav-menu/nav-menu.svelte';
    import SiteHeader from '$lib/components/global/site-header.svelte';

	let { children } = $props();
</script>

<Sidebar.Provider>
    <NavMenu />
    <Sidebar.Inset>
        <main class="w-full">
            <SiteHeader />
            {@render children?.()}
        </main>
    </Sidebar.Inset>
</Sidebar.Provider>

<ModeWatcher />
