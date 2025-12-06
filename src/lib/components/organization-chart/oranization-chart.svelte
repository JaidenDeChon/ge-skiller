<script lang="ts">
  import OrganizationChartNode from './organization-chart-node.svelte';
  import type { OrgNode, TemplateMap } from './models';

  export let value: OrgNode;
  export let selectionMode: "single"|"multiple"|null = null;
  export let selectionKeys: Record<string|number,boolean> = {};
  export let collapsedKeys: Record<string|number,boolean> = {};
  export let collapsible = false;
  export let templates: TemplateMap = {};

  // CALLBACK PROPS — Svelte 5 style
  export let onNodeSelect: ((node:OrgNode)=>void) | undefined = undefined;
  export let onNodeUnselect: ((node:OrgNode)=>void) | undefined = undefined;
  export let onNodeExpand: ((node:OrgNode)=>void) | undefined = undefined;
  export let onNodeCollapse: ((node:OrgNode)=>void) | undefined = undefined;
  export let onUpdateSelectionKeys: ((keys:Record<string,boolean>)=>void) | undefined = undefined;
  export let onUpdateCollapsedKeys: ((keys:Record<string,boolean>)=>void) | undefined = undefined;

  let d_collapsed = {...collapsedKeys};
  $: d_collapsed = { ...collapsedKeys };

  // 🔹 Node click → handles selection
  function handleClick(node:OrgNode) {
    if(!selectionMode) return;

    let next = {...selectionKeys};
    if(next[node.key]) {
      delete next[node.key];
      onNodeUnselect?.(node);
    } else {
      if(selectionMode==="single") next = {};
      next[node.key] = true;
      onNodeSelect?.(node);
    }
    onUpdateSelectionKeys?.(next);
    selectionKeys = next;
  }

  // 🔹 Collapse/expand toggling
  function handleToggle(node:OrgNode) {
    if(d_collapsed[node.key]) {
      delete d_collapsed[node.key];
      onNodeExpand?.(node);
    } else {
      d_collapsed[node.key] = true;
      onNodeCollapse?.(node);
    }

    d_collapsed = {...d_collapsed};
    collapsedKeys = d_collapsed;
    onUpdateCollapsedKeys?.(d_collapsed);
  }
</script>

<div class="p-organizationchart p-component">
  <OrganizationChartNode
    node={value}
    {templates}
    {collapsible}
    collapsedKeys={collapsedKeys}
    {selectionMode}
    {selectionKeys}
    onNodeClick={handleClick}
    onNodeToggle={handleToggle}
  />
</div>

<style>
  .p-organizationchart.p-component {
    display: block;
    width: 100%;
    overflow-x: auto;
  }
</style>
