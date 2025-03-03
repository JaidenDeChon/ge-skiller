<script lang="ts">
    import { buttonVariants } from '$lib/components/ui/button';
    import ResponsiveDialog from '$lib/components/global/responsive-dialog.svelte';
    import CharacterStatsDialog from '$lib/components/dialogs/character-stats/character-stats-dialog.svelte';

    const dialogTitle = 'Enter your skill levels';
</script>

<ResponsiveDialog title={dialogTitle} triggerClass={buttonVariants({ variant: 'default' })}>
    {#snippet trigger()}
        <img src="/skill-images/skills.png" alt="OSRS skills icon" class="w-6 h-6" />
        <span class="rs-font text-xl">{dialogTitle}</span>
    {/snippet}

    {#snippet content()}
        <CharacterStatsDialog />
    {/snippet}
</ResponsiveDialog>
