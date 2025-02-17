<script lang="ts">
    import "../app.css";
    import * as Sidebar from "$lib/components/ui/sidebar";
    import { Toaster } from "$lib/components/ui/sonner";
    import NavMenu from "$lib/components/layout/nav-menu/nav-menu.svelte";
    import SiteHeader from "$lib/components/layout/site-header.svelte";
    import { ModeWatcher } from "mode-watcher";

    let { children } = $props();
</script>

<Toaster />

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
