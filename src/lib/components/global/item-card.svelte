<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import * as Avatar from '$lib/components/ui/avatar';
    import { Separator } from '$lib/components/ui/separator';
    import type { GameItem } from '$lib/models/game-item';

    export let item: GameItem;
</script>

<Card.Root class="hover:border-primary transition-all hover:shadow-xl dark:hover:shadow-none">
    <Card.Header>
        <div class="flex items-center gap-3 mb-3">
            <Avatar.Root class="p-1">
                <Avatar.Image src={`item-images/${item.image}`} alt={item.name} class="object-contain" />
                <Avatar.Fallback>{item.name.slice(0, 2)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="flex flex-col">
                <p class="font-normal text-lg">{item.name}</p>
                <p class="text-muted-foreground"><i>{item.examineText}</i></p>
            </div>
        </div>
        <Separator />
    </Card.Header>
    <Card.Content>
        <div class="flex gap-3 justify-evenly">
            <div class="flex-1 flex gap-4 items-center justify-center">
                <img
                    class="object-contain w-4"
                    src="item-images/coins-lots.png"
                    alt="A tall stack of coins"
                />
                <p>{item.highPrice}</p>
            </div>
            <Separator orientation="vertical" />
            <div class="flex-1 flex gap-4 items-center justify-center">
                <img
                    class="object-contain w-4"
                    src="spell-images/high-level-alchemy.png"
                    alt="A tall stack of coins"
                />
                <p>{item.highPrice}</p>
            </div>
        </div>
    </Card.Content>
</Card.Root>
