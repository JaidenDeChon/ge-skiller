<script lang="ts">
    import { buttonVariants } from '@/components/ui/button';
    import ResponsiveDialog from '../global/responsive-dialog.svelte';

    const ctaText = 'Enter your skill levels';
</script>

<div class="hero h-screen py-16 -mt-16">
    <div class="content-sizing flex flex-col justify-center items-start gap-12 my-12">
        <h1 class="rs-font text-6xl text-primary">Welcome!</h1>
        <div class="text-lg flex flex-col gap-4">
            <p>
                <span class="rs-font text-primary text-xl">osrs-ge-skiller</span>
                helps you find the most profitable OSRS items you can make with your stats.
            </p>

            <p>Powered by real-time Grand Exchange price stats.</p>
        </div>

        <ResponsiveDialog title={ctaText} triggerClass={buttonVariants({ variant: "default" })}>
            {#snippet trigger()}
                <span class="primary">{ctaText}</span>
            {/snippet}

            {#snippet content()}
                ok
            {/snippet}
        </ResponsiveDialog>
    </div>
</div>

<style>
    .hero {
        background: linear-gradient(
                135deg,
                rgba(0, 0, 0, 0) 0%,
                hsl(var(--primary)) 300%
        );
    }
</style>
