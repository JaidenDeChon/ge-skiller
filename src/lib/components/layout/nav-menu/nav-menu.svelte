<script lang="ts">
    import { useSidebar } from '$lib/components/ui/sidebar';
    import * as Sidebar from '$lib/components/ui/sidebar';
    import NavHeader from '$lib/components/layout/nav-menu/nav-header.svelte';
    import NavContents from '$lib/components/layout/nav-menu/nav-contents.svelte';
    import NavFooter from '$lib/components/layout/nav-menu/nav-footer.svelte';

    const sidebar = useSidebar();
</script>

<nav>
    <Sidebar.Root variant="inset" collapsible="icon">
        <!-- Header -->
        <NavHeader />

        <!-- Content -->
        <Sidebar.Content>
            <NavContents />
        </Sidebar.Content>

        <!-- Footer -->
        <Sidebar.Footer>
            <NavFooter />
        </Sidebar.Footer>
    </Sidebar.Root>
</nav>
