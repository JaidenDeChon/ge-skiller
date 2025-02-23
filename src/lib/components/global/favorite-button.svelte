<script lang="ts">
    import { get } from 'svelte/store';
    import { toast } from 'svelte-sonner';
    import { Heart } from 'lucide-svelte';
    import { Button } from '../ui/button';
    import { favoritesStore } from '$lib/stores/favorites-store';
    import type { GameItem } from '$lib/models/game-item';

    const { gameItem }: { gameItem: GameItem } = $props();

    const isFavorited = $derived.by(() => {
        if (!gameItem || !gameItem.id) return false;
        return $favoritesStore.favorites.includes(gameItem.id);
    });

    function handleFavorite() {
        if (!gameItem || !gameItem.id) return;

        let favorites = get(favoritesStore).favorites;
        let updatedFavorites;

        if (isFavorited) updatedFavorites = favorites.filter((id) => id !== gameItem?.id);
        else updatedFavorites = [...favorites, gameItem.id];

        favoritesStore.set({ favorites: updatedFavorites });
        toast.success(`"${gameItem.name}" has been ${isFavorited ? 'favorited' : 'unfavorited'}.`);
    }
</script>

<Button
    variant="ghost"
    size="icon"
    class={['rounded-full transition-opacity', isFavorited && 'text-primary']}
    onclick={handleFavorite}
>
    <Heart fill={isFavorited ? 'hsl(var(--primary))' : 'transparent'} />
</Button>
