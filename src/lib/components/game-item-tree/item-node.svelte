<script lang="ts">
    import type { OrgNode } from '$lib/components/organization-chart/models';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    type IngredientNodeData = {
        item?: IOsrsboxItemWithMeta;
        amount?: number;
        consumedDuringCreation?: boolean;
        depth?: number;
    };

    const { node }: { node: OrgNode } = $props();
    const data = node?.data as IngredientNodeData | undefined;
    const item = data?.item;

    const iconSrc = $derived(iconToDataUri(item?.icon));
    const amountLabel = $derived(data?.amount && data.amount > 1 ? `x${data.amount}` : null);
    const isRoot = $derived((data?.depth ?? 0) === 0);
    const consumedLabel = $derived(data?.consumedDuringCreation === false ? 'Tool (kept)' : null);
</script>

<div class={`ingredient-node ${isRoot ? 'ingredient-node--root' : ''}`}>
    <div class="flex items-center gap-3">
        <div class="relative">
            <div class="icon-wrapper">
                {#if item?.icon}
                    <img src={iconSrc} alt={item.name} class="icon-img" />
                {:else}
                    <span class="icon-fallback">{item?.name?.slice(0, 2) ?? '?'}</span>
                {/if}
            </div>
            {#if amountLabel}
                <span class="quantity-badge">{amountLabel}</span>
            {/if}
        </div>

        <div class="flex flex-col gap-1 text-left">
            <p class="text-sm font-semibold leading-tight line-clamp-2">{item?.name ?? 'Unknown item'}</p>
            {#if item?.examine}
                <p class="text-[11px] text-muted-foreground leading-tight line-clamp-2">{item.examine}</p>
            {/if}
            {#if consumedLabel}
                <span class="chip">{consumedLabel}</span>
            {/if}
        </div>
    </div>
</div>

<style>
    .ingredient-node {
        border-radius: 0.75rem;
        border: 1px solid hsl(var(--border));
        background: hsl(var(--card));
        padding: 0.6rem 0.75rem;
        min-width: 14rem;
        max-width: 16rem;
        transition: box-shadow 150ms ease, transform 150ms ease;
    }

    .ingredient-node--root {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
    }

    .ingredient-node:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    }

    .icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 3rem;
        width: 3rem;
        border-radius: 9999px;
        background: hsl(var(--muted));
        border: 1px solid hsl(var(--border));
        position: relative;
        overflow: hidden;
    }

    .icon-img {
        width: 80%;
        height: 80%;
        object-fit: contain;
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.35));
    }

    .icon-fallback {
        font-weight: 700;
        color: hsl(var(--muted-foreground));
    }

    .quantity-badge {
        position: absolute;
        right: -0.35rem;
        top: -0.35rem;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 0.1rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 700;
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
    }

    .chip {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        background: hsl(var(--muted));
        color: hsl(var(--muted-foreground));
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.01em;
    }
</style>
