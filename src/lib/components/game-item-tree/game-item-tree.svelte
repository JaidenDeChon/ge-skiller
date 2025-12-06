<script lang="ts">
    import * as echarts from 'echarts/core';
    import { TreeChart, type TreeSeriesOption } from 'echarts/charts';
    import { TooltipComponent, type TooltipComponentOption } from 'echarts/components';
    import { CanvasRenderer } from 'echarts/renderers';
    import { onMount } from 'svelte';
    import type { ComposeOption, EChartsType } from 'echarts/core';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import type { IngredientTreeNode } from '$lib/components/game-item-tree/types';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type {
        GameItemCreationIngredient,
        GameItemCreationSpecs,
        IOsrsboxItemWithMeta,
    } from '$lib/models/osrsbox-db-item';

    const { gameItem }: { gameItem: IOsrsboxItemWithMeta | null } = $props();

    echarts.use([TreeChart, TooltipComponent, CanvasRenderer]);

    type ECOption = ComposeOption<TreeSeriesOption | TooltipComponentOption>;
    type ThemeColors = { muted: string; border: string };

    const MAX_TREE_DEPTH = 12;
    const NODE_SYMBOL_SIZE = 54;
    const DEFAULT_THEME_COLORS: ThemeColors = {
        muted: 'hsl(60 4.8% 95.9%)',
        border: 'hsl(20 5.9% 90%)',
    };

    let themeColors = $state<ThemeColors>(DEFAULT_THEME_COLORS);
    let renderTools = $state(true);
    const rootNode = $derived(buildRootNode(gameItem, renderTools));
    const chartOption = $derived(buildChartOption(rootNode, themeColors));

    let chartContainer = $state<HTMLDivElement | null>(null);
    let chartInstance = $state<EChartsType | null>(null);

    function buildRootNode(
        item: IOsrsboxItemWithMeta | null,
        includeTools: boolean,
    ): IngredientTreeNode | null {
        if (!item) return null;

        const visited = new Set<string | number>([item.id ?? 'root']);
        const creationSpec = getPrimaryCreationSpec(item);
        const children = buildChildren(
            creationSpec?.ingredients ?? [],
            `${item.id}`,
            1,
            visited,
            includeTools,
        );

        return {
            key: item.id ?? 'root',
            data: { item, depth: 0 },
            children,
            leaf: !children.length,
        };
    }

    function buildChildren(
        ingredients: GameItemCreationSpecs['ingredients'],
        parentKey: string | number,
        depth: number,
        visited: Set<string | number>,
        includeTools: boolean,
    ): IngredientTreeNode[] {
        if (!ingredients || depth > MAX_TREE_DEPTH) return [];

        return ingredients
            .filter((ingredient) => !shouldSkipIngredient(ingredient, includeTools))
            .map((ingredient, index) =>
                buildNodeFromIngredient(ingredient, parentKey, depth, index, visited, includeTools),
            );
    }

    function buildNodeFromIngredient(
        ingredient: GameItemCreationIngredient,
        parentKey: string | number,
        depth: number,
        index: number,
        visited: Set<string | number>,
        includeTools: boolean,
    ): IngredientTreeNode {
        const ingredientId = ingredient.item?.id ?? `unknown-${index}`;
        const key = `${parentKey}-${ingredientId}-${index}`;

        const nextVisited = new Set<string | number>(visited);

        // Stop cycles: if we've seen this id in the current path, don't recurse further.
        const alreadyVisited = nextVisited.has(ingredientId);
        if (!alreadyVisited) nextVisited.add(ingredientId);

        const creationSpec =
            !alreadyVisited && depth < MAX_TREE_DEPTH && ingredient.item
                ? getPrimaryCreationSpec(ingredient.item)
                : undefined;

        const children =
            alreadyVisited || !creationSpec
                ? []
                : buildChildren(creationSpec.ingredients ?? [], key, depth + 1, nextVisited, includeTools);

        return {
            key,
            data: {
                item: ingredient.item as IOsrsboxItemWithMeta | undefined,
                amount: ingredient.amount,
                consumedDuringCreation: ingredient.consumedDuringCreation,
                depth,
            },
            children,
            leaf: !children.length,
        };
    }

    function shouldSkipIngredient(
        ingredient: GameItemCreationIngredient,
        includeTools: boolean,
    ): boolean {
        if (!includeTools && ingredient.consumedDuringCreation === false) return true;

        return false;
    }

    function resolveThemeColors(): ThemeColors {
        if (typeof window === 'undefined') return DEFAULT_THEME_COLORS;

        const styles = getComputedStyle(document.documentElement);
        const muted = styles.getPropertyValue('--muted').trim();
        const border = styles.getPropertyValue('--border').trim();

        return {
            muted: muted ? `hsl(${muted})` : DEFAULT_THEME_COLORS.muted,
            border: border ? `hsl(${border})` : DEFAULT_THEME_COLORS.border,
        };
    }

    function buildChartOption(node: IngredientTreeNode | null, colors: ThemeColors): ECOption | null {
        if (!node) return null;

        return {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
            },
            series: [
                {
                    type: 'tree',
                    layout: 'radial',
                    data: [toEChartsNode(node)],
                    top: '4%',
                    bottom: '4%',
                    left: '4%',
                    right: '4%',
                    roam: true,
                    symbol: undefined,
                    symbolSize: NODE_SYMBOL_SIZE,
                    initialTreeDepth: 3,
                    animationDurationUpdate: 400,
                    emphasis: { focus: 'descendant' },
                    label: { show: false },
                    leaves: { label: { show: false } },
                },
            ],
        };
    }

    function withAlpha(color: string, alpha: number): string {
        if (color.startsWith('hsl(') && color.endsWith(')')) {
            return color.replace(')', ` / ${alpha})`);
        }
        if (color.startsWith('hsla(') && color.endsWith(')')) {
            return color.replace(/[^,]+(?=\)\s*$)/, `${alpha}`);
        }
        return color;
    }

    function buildIconSymbol(icon: string | null | undefined, colors: ThemeColors): string {
        const dataUri = iconToDataUri(icon);
        const mutedFill = colors.muted || DEFAULT_THEME_COLORS.muted;
        const transparentMuted = withAlpha(mutedFill, 0.83);
        const borderStroke = colors.border || DEFAULT_THEME_COLORS.border;
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
                <defs>
                    <filter id="iconShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="1" dy="2" stdDeviation="1.8" flood-color="rgba(0,0,0,0.3)" />
                    </filter>
                    <clipPath id="clip">
                        <circle cx="36" cy="36" r="29" />
                    </clipPath>
                </defs>
                <circle cx="36" cy="36" r="30" fill="${transparentMuted}" stroke="${borderStroke}" stroke-width="1" />
                <image href="${dataUri}" x="12" y="12" width="48" height="48" preserveAspectRatio="xMidYMid meet" clip-path="url(#clip)" filter="url(#iconShadow)" />
            </svg>
        `;

        return `image://data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    function toEChartsNode(node: IngredientTreeNode): NonNullable<TreeSeriesOption['data']>[number] {
        const name = node.data.item?.name ?? 'Unknown item';
        const iconSymbol = buildIconSymbol(node.data.item?.icon, themeColors);

        return {
            name,
            value: node.data.amount,
            symbol: iconSymbol,
            symbolSize: NODE_SYMBOL_SIZE,
            children: node.children?.map(toEChartsNode) ?? [],
        };
    }

    onMount(() => {
        themeColors = resolveThemeColors();

        if (!chartContainer) return;

        chartInstance = echarts.init(chartContainer);
        if (chartOption) {
            chartInstance.setOption(chartOption);
        }

        const themeObserver = new MutationObserver(() => {
            themeColors = resolveThemeColors();
        });
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });

        const resizeObserver = new ResizeObserver(() => {
            chartInstance?.resize();
        });
        resizeObserver.observe(chartContainer);

        return () => {
            resizeObserver.disconnect();
            themeObserver.disconnect();
            chartInstance?.dispose();
            chartInstance = null;
        };
    });

    $effect(() => {
        if (!chartInstance) return;

        if (!chartOption) {
            chartInstance.clear();
            return;
        }

        chartInstance.setOption(chartOption, true);
    });
</script>

{#if rootNode}
    <div class="game-item-tree-shell">
        <div class="chart-controls">
            <div class="control-row">
                <label class="control-label">
                    <input type="checkbox" bind:checked={renderTools} />
                    Show tools (Hammer, Needle, etc)
                </label>
            </div>
        </div>
        <div class="game-item-tree-chart" bind:this={chartContainer}></div>
    </div>
{:else}
    <p class="text-sm text-muted-foreground">No ingredient data available for this item.</p>
{/if}

<style>
    .game-item-tree-shell {
        position: relative;
    }

    .chart-controls {
        position: absolute;
        top: 0.75rem;
        left: 0.75rem;
        z-index: 5;
        padding: 0.5rem 0.75rem;
        border-radius: 0.75rem;
        background: color-mix(in srgb, hsl(var(--background)) 80%, transparent);
        border: 1px solid hsl(var(--border));
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .control-row {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        color: hsl(var(--foreground));
        font-size: 0.85rem;
    }

    .control-label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        cursor: pointer;
        user-select: none;
    }

    .control-label input {
        accent-color: hsl(var(--primary));
    }

    .game-item-tree-chart {
        height: 28rem;
        width: 100%;
    }
</style>
