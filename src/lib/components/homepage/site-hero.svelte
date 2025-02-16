<script lang="ts">
    import { buttonVariants } from '$lib/components/ui/button';
    import ResponsiveDialog from '../global/responsive-dialog.svelte';

    const ctaText = 'Enter your skill levels';

    const { bgUrl } = $props();
</script>

<div class="py-32 relative overflow-y-hidden">
    <div class="content-sizing relative flex flex-col justify-center items-start gap-6 z-20">
        <!-- Background effect with image and glow -->
        <div class="h-96 w-96 rounded-full bg-primary absolute top-full right-1/4 translate-x-1/2 -translate-y-1/2 z-0 blur-3xl scale-150 opacity-5 xl:opacity-15"></div>
        <img
            src={bgUrl}
            alt="randomly-selected background"
            class="w-64 absolute top-3/4 right-1/4 translate-x-1/2 -translate-y-1/2 z-10 opacity-15 xl:opacity-100"
        >

        <div class="flex flex-col font-black bg-gradient-to-r from-primary to-yellow-600 text-transparent bg-clip-text">
            <h1 class="text-2xl md:text-3xl">osrs-</h1>
            <h1 class="text-5xl md:text-6xl font-black bg-gradient-to-r from-primary to-yellow-600 text-transparent bg-clip-text">
                skillionaire
            </h1>
        </div>
        <div class="text-lg flex flex-col gap-1">
            <p>
                A free tool for finding the most valuable items you can make with
                <strong>your levels</strong>.
            </p>

            <p class="text-muted-foreground">Powered by real-time GE prices.</p>
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

        <a href="items" class="{buttonVariants({ variant: 'secondary' })}">
            <img
                src="/other-images/inventory-backpack.png"
                alt="Inventory backpack"
                class="w-6 h-6"
            >
            <span class="rs-font text-xl dark:text-primary">Start browsing items</span>
        </a>
    </div>
</div>
