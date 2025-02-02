<script lang="ts">
    import { Button } from '@/components/ui/button';
    import ResponsiveDialog from '../global/responsive-dialog.svelte';

    const ctaText = 'Enter your skill levels';
</script>

<div class="hero h-screen py-12 -mt-16">
    <div class="content-sizing flex flex-col justify-center items-start gap-12 mt-12">
        <h1 class="rs-font text-6xl text-primary">Welcome!</h1>
        <div class="text-lg flex flex-col gap-4">
            <p>
                <span class="rs-font text-primary text-xl">osrs-ge-skiller</span>
                helps you find the most profitable OSRS items you can make with your stats.
            </p>

            <p>Powered by real-time Grand Exchange price stats.</p>
        </div>

        <ResponsiveDialog title={ctaText}>
            {#snippet trigger()}
                <Button class="w-min">{ctaText}</Button>
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
