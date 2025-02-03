<script lang="ts">
	import '../app.css';
    import { ModeWatcher } from 'mode-watcher';
    import SiteHeader from '$lib/components/global/site-header.svelte';

	let { children } = $props();
</script>

<ModeWatcher />

<SiteHeader />
{@render children()}
