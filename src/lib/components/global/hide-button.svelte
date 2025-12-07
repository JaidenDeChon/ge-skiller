<script lang="ts">
    import { get } from 'svelte/store';
    import { toast } from 'svelte-sonner';
    import { EyeOff, Eye } from 'lucide-svelte';
    import { Button } from '../ui/button';
    import { hiddenStore } from '$lib/stores/hidden-store';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    type HideableItem = Pick<IOsrsboxItemWithMeta, 'id' | 'name'>;

    const { gameItem }: { gameItem: HideableItem } = $props();

    const isHidden = $derived.by(() => {
        if (!gameItem || !gameItem.id) return false;
        return $hiddenStore.hidden.includes(gameItem.id);
    });

    function handleToggleHidden() {
        if (!gameItem || !gameItem.id) return;

        const current = get(hiddenStore).hidden;
        const next = isHidden ? current.filter((id) => id !== gameItem.id) : [...current, gameItem.id];

        hiddenStore.set({ hidden: next });
        const nowHidden = next.includes(gameItem.id);
        toast.success(`\"${gameItem.name}\" has been ${nowHidden ? 'hidden' : 'unhidden'}.`);
    }
</script>

<Button
    variant="outline"
    size="icon"
    class={[
        'rounded-full transition-colors text-muted-foreground hover:text-muted-foreground',
        isHidden && 'text-muted-foreground',
    ]}
    onclick={handleToggleHidden}
    aria-label={isHidden ? 'Unhide item' : 'Hide item'}
    title={isHidden ? 'Unhide item' : 'Hide item'}
>
    {#if isHidden}
        <EyeOff />
    {:else}
        <Eye />
    {/if}
</Button>
