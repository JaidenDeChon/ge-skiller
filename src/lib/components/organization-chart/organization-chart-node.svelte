<script lang="ts">
  import type { OrgNode, TemplateMap } from './models';

  // Props
  export let node: OrgNode;
  export let templates: TemplateMap = {};
  export let collapsible = false;
  export let collapsedKeys: Record<string | number, boolean> = {};
  export let selectionKeys: Record<string | number, boolean> = {};
  export let selectionMode: "single" | "multiple" | null = null;

  // Svelte 5 callback props (REPLACES dispatchers)
  export let onNodeClick: ((node: OrgNode) => void) | undefined = undefined;
  export let onNodeToggle: ((node: OrgNode) => void) | undefined = undefined;

  // Derived
  $: leaf = node.leaf === false ? false : !(node.children?.length);
  $: expanded = collapsedKeys[node.key] === undefined;
  $: selectable = !!selectionMode && node.selectable !== false;
  $: selected = selectable && selectionKeys[node.key] === true;
  $: toggleable = collapsible && node.collapsible !== false && !leaf;
  $: colspan = node.children?.length ? node.children.length * 2 : undefined;
  $: childVisibility = !leaf && expanded ? "inherit" : "hidden";
  $: defaultLabel =
    typeof node?.data === 'object' && node?.data && 'label' in node.data
      ? (node.data as { label?: string }).label ?? node.key
      : node.key;

  // Handlers
  function clickNode() {
    if (!selectionMode || !onNodeClick) return;
    onNodeClick(node);
  }

  function handleNodeKeydown(event: KeyboardEvent) {
    if (!selectionMode) return;

    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.code === 'Space' ||
      event.code === 'Spacebar' ||
      event.code === 'NumpadEnter'
    ) {
      event.preventDefault();
      clickNode();
    }
  }

  function toggle() {
    if (onNodeToggle) onNodeToggle(node);
  }

  function toggleKey(event: KeyboardEvent) {
    if (["Enter", "Space", "NumpadEnter"].includes(event.code)) {
      event.preventDefault();
      toggle();
    }
  }

  // Template resolution
  const T = (node.type && templates[node.type]) || templates.default;
  const ToggleIcon = templates.toggleicon || templates.togglericon;

  $: nodeClasses = [
    'p-organizationchart-node inline-flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-all duration-150',
    selectable
      ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      : 'cursor-default focus-visible:outline-none',
    selected ? 'border-primary ring-2 ring-primary/30 shadow-lg' : 'border-border/70',
    node.styleClass || ''
  ].join(' ');

  const toggleButtonClasses =
    'p-organizationchart-node-toggle-button ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-muted text-muted-foreground text-xs transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
</script>

<table class="p-organizationchart-table mx-auto border-collapse text-sm text-foreground">
  <tbody>
    {#if node}
      <tr>
        <td {colspan} class="p-0 align-top">
          <div
            class={nodeClasses}
            on:click={clickNode}
            on:keydown={handleNodeKeydown}
            role="button"
            tabindex="0"
            aria-pressed={selected}
          >
            {#if T}
              <svelte:component this={T} {node} />
            {:else}
              <span>{defaultLabel}</span>
            {/if}

            {#if toggleable}
              <button
                class={toggleButtonClasses}
                on:click|stopPropagation={toggle}
                on:keydown={toggleKey}
                aria-label="Toggle children"
                aria-expanded={expanded}
                type="button"
              >
                {#if ToggleIcon}
                  <svelte:component this={ToggleIcon} expanded={expanded} />
                {:else}
                  {#if expanded}▾{:else}▸{/if}
                {/if}
              </button>
            {/if}
          </div>
        </td>
      </tr>
    {/if}

    <!-- Down connector -->
    <tr
      class="p-organizationchart-connectors"
      style={`visibility:${childVisibility}`}
    >
      <td {colspan} class="p-0 align-top text-center">
        <div class="p-organizationchart-connector-down mx-auto h-4 w-px bg-border/70"></div>
      </td>
    </tr>

    <!-- Branch connectors -->
    <tr
      class="p-organizationchart-connectors"
      style={`visibility:${childVisibility}`}
    >
      {#if node.children?.length === 1}
        <td {colspan} class="p-0 align-top text-center">
          <div class="p-organizationchart-connector-down mx-auto h-4 w-px bg-border/70"></div>
        </td>

      {:else if node.children?.length !== undefined && node.children.length > 1}
        {#each node.children as child, i (child.key)}
          <td
            class={`p-organizationchart-connector-left h-4 align-top border-t border-border/70 p-0 text-center ${
              i > 0 ? 'p-organizationchart-connector-line-top' : ''
            }`}
          >
            &nbsp;
          </td>
          <td
            class={`p-organizationchart-connector-right h-4 align-top border-t border-border/70 p-0 text-center ${
              i < node.children.length - 1 ? 'p-organizationchart-connector-line-top' : ''
            }`}
          >
            &nbsp;
          </td>
        {/each}
      {/if}
    </tr>

    <!-- Children -->
    <tr
      class="p-organizationchart-node-children"
      style={`visibility:${childVisibility}`}
    >
      {#each node.children || [] as child (child.key)}
        <td colspan="2" class="p-organizationchart-node-cell align-top pt-2 text-center">
          <svelte:self
            {child}
            node={child}
            {templates}
            {collapsible}
            collapsedKeys={collapsedKeys}
            {selectionMode}
            {selectionKeys}
            onNodeClick={onNodeClick}
            onNodeToggle={onNodeToggle}
          />
        </td>
      {/each}
    </tr>
  </tbody>
</table>
