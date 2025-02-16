<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Avatar from "$lib/components/ui/avatar";
    import { Separator } from "$lib/components/ui/separator";
    import type { GameItem } from "$lib/models/game-item";

    export let item: GameItem;
</script>

<div class="custom-card">
    <!-- Header -->
    <div class="flex justify-between">
        <div class="flex flex-col mb-2 text-sm">
            <span class="font-medium">{item.name}</span>
            <span class="text-muted-foreground">{item.examineText}</span>
        </div>
        <Avatar.Root class="p-2 bg-muted border">
            <Avatar.Image
                src="/item-images/{item.image}"
                alt={item.name}
                class="object-contain"
            />
            <Avatar.Fallback>{item.name}</Avatar.Fallback>
        </Avatar.Root>
    </div>
</div>
