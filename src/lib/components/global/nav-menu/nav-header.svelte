<script>
    import * as Sidebar from '$lib/components/ui/sidebar';
    import CharacterSwitcher from '$lib/components/global/character-switcher.svelte';
</script>

<!-- Header element of app Sidebar. -->
<Sidebar.Header>
    <Sidebar.Menu>
        <Sidebar.MenuItem>
            <!-- Use the global character switcher as the header contents. -->
            <CharacterSwitcher />
        </Sidebar.MenuItem>
    </Sidebar.Menu>
</Sidebar.Header>
