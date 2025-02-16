<script lang="ts">
    import SiteHero from '$lib/components/homepage/site-hero.svelte';
    import SiteFaq from '$lib/components/global/site-faq.svelte';

    export let data;
</script>

<SiteHero bgUrl={data.imageUrl} />

<SiteFaq />
