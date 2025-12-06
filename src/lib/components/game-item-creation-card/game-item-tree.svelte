<script lang="ts">
    import * as echarts from 'echarts/core';
    import { TreeChart, type TreeSeriesOption } from 'echarts/charts';
    import { TooltipComponent, type TooltipComponentOption } from 'echarts/components';
    import { CanvasRenderer } from 'echarts/renderers';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import type { ComposeOption, EChartsType } from 'echarts/core';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import type { IngredientTreeNode } from '$lib/components/game-item-creation-card/types';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type {
        GameItemCreationIngredient,
        GameItemCreationSpecs,
        IOsrsboxItemWithMeta,
    } from '$lib/models/osrsbox-db-item';

    const { gameItem, creationSpec: creationSpecOverride = null }: { gameItem: IOsrsboxItemWithMeta | null; creationSpec?: GameItemCreationSpecs | null } =
        $props();

    echarts.use([TreeChart, TooltipComponent, CanvasRenderer]);

    type ECOption = ComposeOption<TreeSeriesOption | TooltipComponentOption>;
    type ThemeColors = { muted: string; border: string };
    type TreeDatum = NonNullable<TreeSeriesOption['data']>[number] & {
        tooltipData?: {
            name: string;
            examine?: string;
            icon?: string;
        };
        itemId?: string | number | null;
    };

    const MAX_TREE_DEPTH = 12;
    const NODE_SYMBOL_SIZE = 54;
    const DEFAULT_THEME_COLORS: ThemeColors = {
        muted: 'hsl(60 4.8% 95.9%)',
        border: 'hsl(20 5.9% 90%)',
    };

    let themeColors = $state<ThemeColors>(DEFAULT_THEME_COLORS);
    let renderTools = $state(true);
    let isMobile = $state(false);
    const rootNode = $derived(buildRootNode(gameItem, creationSpecOverride, renderTools));
    const chartOption = $derived(buildChartOption(rootNode, themeColors, isMobile));

    let chartContainer = $state<HTMLDivElement | null>(null);
    let chartInstance = $state<EChartsType | null>(null);

    function buildRootNode(
        item: IOsrsboxItemWithMeta | null,
        overrideSpec: GameItemCreationSpecs | null,
        includeTools: boolean,
    ): IngredientTreeNode | null {
        if (!item) return null;

        const visited = new Set<string | number>([item.id ?? 'root']);
        const creationSpec = overrideSpec ?? getPrimaryCreationSpec(item);
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

    function buildChartOption(
        node: IngredientTreeNode | null,
        colors: ThemeColors,
        mobile: boolean,
    ): ECOption | null {
        if (!node) return null;

        const orient = mobile ? 'TB' : 'LR';
        const position = mobile
            ? { top: '4%', bottom: '10%', left: '8%', right: '8%' }
            : { top: '6%', bottom: '6%', left: '6%', right: '12%' };

        return {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                backgroundColor: 'transparent',
                borderWidth: 0,
                padding: 0,
                extraCssText: 'box-shadow:none;',
                formatter: (params) => {
                    const data = (params?.data as TreeDatum | undefined)?.tooltipData;
                    return buildTooltipContent(data, colors);
                },
            },
            series: [
                {
                    type: 'tree',
                    layout: 'orthogonal',
                    orient,
                    data: [toEChartsNode(node)],
                    ...position,
                    roam: true,
                    symbol: undefined,
                    symbolSize: NODE_SYMBOL_SIZE,
                    initialTreeDepth: 3,
                    animationDurationUpdate: 400,
                    expandAndCollapse: false,
                    lineStyle: {
                        color: withAlpha(colors.border || DEFAULT_THEME_COLORS.border, 0.92),
                        width: 1.6,
                    },
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

    function buildIconSymbol(
        icon: string | null | undefined,
        colors: ThemeColors,
        amount?: number | null,
    ): string {
        const dataUri = iconToDataUri(icon);
        const mutedFill = colors.muted || DEFAULT_THEME_COLORS.muted;
        const transparentMuted = withAlpha(mutedFill, 0.83);
        const borderStroke = colors.border || DEFAULT_THEME_COLORS.border;
        const amountDisplay =
            amount && amount > 1 ? (amount > 999 ? '999+' : `${Math.round(amount)}`) : null;
        const badge = amountDisplay
            ? `
                <g>
                    <circle cx="54" cy="16" r="11" fill="#facc15" stroke="d97706" stroke-width="1.25" />
                    <text x="54" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="#3b2f1a" font-family="inherit">${amountDisplay}</text>
                </g>
            `
            : '';
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
                <circle cx="36" cy="36" r="30" fill="${transparentMuted}" stroke="${borderStroke}" stroke-width="1.4" stroke-opacity="0.95" />
                <image href="${dataUri}" x="12" y="12" width="48" height="48" preserveAspectRatio="xMidYMid meet" clip-path="url(#clip)" filter="url(#iconShadow)" />
                ${badge}
            </svg>
        `;

        return `image://data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    function toEChartsNode(node: IngredientTreeNode): TreeDatum {
        const name = node.data.item?.name ?? 'Unknown item';
        const iconSymbol = buildIconSymbol(node.data.item?.icon, themeColors, node.data.amount);
        const tooltipData = {
            name,
            examine: node.data.item?.examine ?? '',
            icon: iconToDataUri(node.data.item?.icon),
        };

        return {
            name,
            value: node.data.amount,
            symbol: iconSymbol,
            symbolSize: NODE_SYMBOL_SIZE,
            tooltipData,
            itemId: node.data.item?.id ?? null,
            children: node.children?.map(toEChartsNode) ?? [],
        };
    }

    function escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildTooltipContent(data: TreeDatum['tooltipData'] | undefined, colors: ThemeColors): string {
        if (!data) return '';
        const name = escapeHtml(data.name);
        const examine = data.examine ? escapeHtml(data.examine) : '';
        const icon = data.icon ?? '';
        const bg = 'hsl(var(--card))';
        const border = colors.border || DEFAULT_THEME_COLORS.border;

        return `
            <div style="
                display:flex;
                align-items:flex-start;
                gap:0.75rem;
                padding:0.6rem 0.75rem;
                border-radius:0.75rem;
                background:${bg};
                border:1px solid ${border};
                box-shadow:0 10px 25px rgba(0,0,0,0.12);
                max-width:16rem;
                min-width:14rem;
                word-break:break-word;
                white-space:normal;
            ">
                <div style="
                    flex-shrink:0;
                    height:48px;
                    width:48px;
                    border-radius:9999px;
                    background:${withAlpha(colors.muted || DEFAULT_THEME_COLORS.muted, 0.9)};
                    border:1px solid ${border};
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    overflow:hidden;
                ">
                    ${
                        icon
                            ? `<img src="${icon}" alt="${name}" style="height:80%;width:80%;object-fit:contain;filter:drop-shadow(1px 2px 3px rgba(0,0,0,0.35));" />`
                            : `<span style="font-weight:700;color:hsl(var(--muted-foreground));font-size:0.8rem;">${name.slice(0, 2)}</span>`
                    }
                </div>
                <div style="display:flex;flex-direction:column;gap:0.35rem;min-width:0;word-break:break-word;overflow-wrap:anywhere;white-space:normal;">
                    <div style="font-weight:600;font-size:0.875rem;line-height:1.45;color:hsl(var(--foreground));">${name}</div>
                    ${
                        examine
                            ? `<div style="font-size:0.6875rem;line-height:1.35;color:hsl(var(--muted-foreground));word-break:break-word;overflow-wrap:anywhere;white-space:normal;">${examine}</div>`
                            : ''
                    }
                </div>
            </div>
        `;
    }

    onMount(() => {
        themeColors = resolveThemeColors();
        const mq = window.matchMedia('(max-width: 768px)');
        const handleMq = (event: MediaQueryListEvent | MediaQueryList) => {
            isMobile = event.matches;
        };
        handleMq(mq);
        mq.addEventListener('change', handleMq);

        if (!chartContainer) return;

        chartInstance = echarts.init(chartContainer);
        if (chartOption) {
            chartInstance.setOption(chartOption);
        }
        chartInstance.on('click', handleNodeClick);
        chartInstance.getZr().setCursorStyle('pointer');

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
            mq.removeEventListener('change', handleMq);
            chartInstance?.off('click', handleNodeClick);
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

    function handleNodeClick(params: { data?: TreeDatum }) {
        const itemId = params?.data?.itemId;
        if (!itemId) return;
        goto(`/items/${itemId}`);
    }
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
