<script lang="ts">
    import { mount, unmount, tick } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { OrgChart } from 'd3-org-chart';
    import { page } from '$app/state';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Breadcrumb from '$lib/components/ui/breadcrumb';
    import * as Card from '$lib/components/ui/card';
    import IconBadge from '$lib/components/global/icon-badge.svelte';
    import FavoriteButton from '$lib/components/global/favorite-button.svelte';
    import GameItemTree from '$lib/components/game-item-tree/game-item-tree.svelte';
    import ItemNode from '$lib/components/game-item-tree/item-node.svelte';
    import type { GameItem } from '$lib/models/game-item';

    const slug = $derived(page.params.id);
    let loading = $state(true);
    let gameItem = $state<GameItem | null>(null);

    // Load the game item data once it's available.
    $effect(() => {
        if (!slug) return;

        fetch(`/api/game-items/?id=${slug}`)
            .then(async (response) => {
                gameItem = await response.json();
                loading = false;
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to fetch all item data.', {
                    description: 'There may be issues on the page.',
                    action: {
                        label: 'Go back',
                        onClick: () => window.history.back(),
                    },
                });
            });
    });

    const renderChart = $derived(!!gameItem?.creationSpecs?.ingredients?.length);
</script>

<!-- Header -->
<header>
    <div class="flex justify-between items-center w-full">
        {#if loading || !gameItem}
            <div class="flex gap-5">
                <Skeleton class="h-4 w-10" />
                <Skeleton class="h-4 w-10" />
                <Skeleton class="h-4 w-32" />
            </div>
            <Skeleton class="rounded-full w-10 h-10" />
        {:else}
            <!-- Breadcrumbs and favorite -->
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <!-- Home -->
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
                    </Breadcrumb.Item>

                    <Breadcrumb.Separator />

                    <!-- Items -->
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/items">Items</Breadcrumb.Link>
                    </Breadcrumb.Item>

                    <Breadcrumb.Separator />

                    <!-- This page -->
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>{gameItem?.name}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>

            <!-- Favorite button -->
            <FavoriteButton {gameItem} />
        {/if}
    </div>

    <!-- Item name, description, color -->
    <!-- py-3 makes up for py-3 from .content-sizing -->
    <div class="flex gap-6 my-4 py-3">
        <!-- Item image -->
        {#if loading || !gameItem}
            <Skeleton class="h-16 w-16 rounded-full" />
        {:else}
            <Avatar.Root class="p-3 bg-muted border item-card__img-background h-16 w-16">
                <Avatar.Image
                    src="/item-images/{gameItem.image}"
                    alt={gameItem.name}
                    class="item-page__item-image object-contain animate-fade-in"
                />
                <Avatar.Fallback class="animate-fade-in-delayed">{gameItem.name.substring(0, 2)}</Avatar.Fallback>
            </Avatar.Root>
        {/if}

        <!-- Name and description -->
        <div class="flex flex-col gap-1 justify-center">
            {#if loading || !gameItem}
                <Skeleton class="h-7 w-52 mb-2" />
                <Skeleton class="h-3 w-36" />
            {:else}
                <h1 class="text-2xl font-bold animate-fade-in">{gameItem.name}</h1>
                <p class="text-muted-foreground text-sm animate-fade-in">
                    {gameItem.examineText}
                </p>
            {/if}
        </div>
    </div>
</header>

<!-- Skill tags -->
<IconBadge text="Crafting">
    {#snippet icon()}
        <Avatar.Root class="h-4 w-4">
            <Avatar.Image src="/skill-images/crafting.png"></Avatar.Image>
        </Avatar.Root>
    {/snippet}
</IconBadge>

<!-- Item tree card -->
<Card.Root class="mt-4 pb-5">
    {#if loading}
        <Skeleton class="w-48 max-w-full h-5 ml-5 mt-8 mb-2" />
        <Skeleton class="w-60 max-w-full h-3 ml-5 mt-4 mb-2" />
        <Skeleton class="mx-5 mt-5 h-80" />
    {:else}
        <!-- Header -->
        <Card.Header>
            <Card.Title class="text-xl">Item ingredients tree</Card.Title>
            <Card.Description>
                {gameItem?.creationSpecs?.ingredients.length
                    ? 'Explore the ingredients that make up this item'
                    : 'This item has no ingredients.'}
            </Card.Description>
        </Card.Header>

        <!-- Chart contents -->
        {#if renderChart}
            <Card.Content class="p-0 bg-muted mx-5 mt-5 rounded-md">
                <GameItemTree gameItem={gameItem!} />
            </Card.Content>
        {/if}
    {/if}
</Card.Root>

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
