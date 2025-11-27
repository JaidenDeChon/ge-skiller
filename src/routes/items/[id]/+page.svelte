<script lang="ts">
    import { page } from '$app/state';
    import { toast } from 'svelte-sonner';
    import { Star, StarOff } from 'lucide-svelte';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Breadcrumb from '$lib/components/ui/breadcrumb';
    import IconBadge from '$lib/components/global/icon-badge.svelte';
    import FavoriteButton from '$lib/components/global/favorite-button.svelte';
    import GameItemTreeCard from '$lib/components/game-item-tree/game-item-tree-card.svelte';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import type { IGameItem, SkillLevelDesignation } from '$lib/models/game-item';

    type AssociatedSkillsArray = NonNullable<IGameItem['creationSpecs']>['requiredSkills'];

    const slug = $derived(page.params.id);
    let loading = $state(true);
    let gameItem = $state<IGameItem | null>(null);
    let associatedSkills = $state(undefined as undefined | AssociatedSkillsArray);
    const iconSrc = $derived(iconToDataUri(gameItem?.icon));

    // Load the game item data once it's available.
    $effect(() => {
        if (!slug) return;

        fetch(`/api/game-item-full-tree/?id=${slug}`)
            .then(async (response) => {
                gameItem = await response.json();

                if (!gameItem) throw new Error('');

                getAssociatedSkills(gameItem);
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

    /**
     * Recursively searches through the IGameItem object's `creationSpecs` property to gather a list of all associated
     * skills.
     * @param item {IGameItem} The IGameItem object to search.
     */
    function getAssociatedSkills(item: IGameItem): void {
        const foundSkills: AssociatedSkillsArray = [];

        function extractSkills(gameItem: IGameItem) {
            if (gameItem.creationSpecs?.requiredSkills) {
                gameItem.creationSpecs.requiredSkills.forEach((requiredSkill: SkillLevelDesignation) => {
                    if (
                        !foundSkills.some(
                            (foundSkill: SkillLevelDesignation) => foundSkill.skillName === requiredSkill.skillName,
                        )
                    ) {
                        foundSkills.push(requiredSkill);
                    }
                });
            }

            if (gameItem.creationSpecs?.ingredients) {
                gameItem.creationSpecs.ingredients.forEach((ingredient) => {
                    if (ingredient.item) {
                        extractSkills(ingredient.item);
                    }
                });
            }
        }

        extractSkills(item);
        associatedSkills = foundSkills;
    }
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

            <!-- Members indicator -->

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
                {#if gameItem.icon}
                    <Avatar.Image
                        src={iconSrc()}
                        alt={gameItem.name}
                        class="item-page__item-image object-contain animate-fade-in"
                    />
                {:else}
                    <Avatar.Fallback class="animate-fade-in-delayed">{gameItem.name?.substring(0, 2)}</Avatar.Fallback>
                {/if}
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
                    {gameItem.examine}
                </p>
            {/if}
        </div>
    </div>
</header>

<!-- Skill tags -->

<div class="flex gap-3 flex-wrap">
    <IconBadge text={gameItem?.members ? 'Members' : 'Free to play'}>
        {#snippet icon()}
            <!-- Members indicator -->
            {#if gameItem?.members}
                <Star class="size-5 p-0.5 fill-primary text-transparent" />
            {:else}
                <StarOff class="size-5 p-0.5 text-muted-foreground" />
            {/if}
        {/snippet}
    </IconBadge>

    {#if associatedSkills?.length}
        {#each associatedSkills as associatedSkill}
            <IconBadge text={associatedSkill.skillName} secondaryText={associatedSkill.skillLevel.toString()}>
                {#snippet icon()}
                    <Avatar.Root class="size-5 p-0.5">
                        <Avatar.Image src="/skill-images/{associatedSkill.skillName}.png"></Avatar.Image>
                    </Avatar.Root>
                {/snippet}
            </IconBadge>
        {/each}
    {/if}
</div>

<!-- Item tree card -->
<GameItemTreeCard rootClass="mt-4 pb-5" {gameItem} {loading} {renderChart} />

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
