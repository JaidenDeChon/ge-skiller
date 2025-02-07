<script lang="ts">
    import { buttonVariants } from '$lib/components/ui/button';
    import ResponsiveDialog from '../global/responsive-dialog.svelte';

    const ctaText = 'Enter your skill levels';
</script>

<div class="hero py-32">
    <div class="content-sizing flex flex-col justify-center items-start gap-6">
        <div class="flex flex-col font-black bg-gradient-to-r from-primary to-yellow-600 text-transparent bg-clip-text">
            <h1 class="text-2xl md:text-3xl">osrs-</h1>
            <h1 class="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-yellow-600 text-transparent bg-clip-text">
                skillionaire
            </h1>
        </div>
        <div class="text-lg flex flex-col gap-1">
            <p>
                Find the most profitable items you can make with
                <strong>your levels</strong>.
            </p>

            <p>Powered by real-time GE prices.</p>
        </div>

        <ResponsiveDialog title={ctaText} triggerClass={buttonVariants({ variant: "default" })}>
            {#snippet trigger()}
                <img
                    src="/skill-images/skills.png"
                    alt="OSRS skills icon"
                    class="w-6 h-6"
                >
                <span class="primary rs-font text-xl">{ctaText}</span>
            {/snippet}

            {#snippet content()}
                ok
            {/snippet}
        </ResponsiveDialog>
    </div>
</div>

<style>
</style>
