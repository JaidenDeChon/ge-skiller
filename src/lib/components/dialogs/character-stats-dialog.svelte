<script lang="ts">
    import { onMount } from 'svelte';
    import { get, writable } from 'svelte/store';
    import { Loader2Icon } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Footer } from '$lib/components/ui/dialog';
    import { buttonVariants } from '$lib/components/ui/button';
    import { toast } from 'svelte-sonner';
    import * as Dialog from '$lib/components/ui/dialog';
    import { CharacterProfile } from '$lib/models/player-stats';
    import { getStoreRoot, getCharacters } from '$lib/stores/character-store.svelte';
    import { fetchCharacterDetailsFromWOM } from '$lib/services/wise-old-man-service';

    onMount(() => {
        if (!populateCharacter) {
        populatedStats.set(new CharacterProfile(''));
        return;
        }
        const found = characters.find((c) => c.name === populateCharacter);
        if (found) populatedStats.set(deepClone(found));
    });

    let {
        trigger,
        triggerClass = buttonVariants({ variant: 'default' }),
        populateCharacter = '',
        onClose = () => { open.set(false); },
        onCharacterSelected = () => { console.log(('what im a gonna do'))},
    } = $props();

    const padding = 'p-2'

    // Controls whether the dialog is open.
    let open = writable(false);

    // Upon closing dialog, reset populated stats to empty.
    $effect(() => {
        if (!$open) {
            populatedStats.set(new CharacterProfile(''));
            isLoading.set(false);
        }
    });

    // Denotes whether we're in the process of loading/importing character data.
    const isLoading = writable(false);

    const characterStore = $derived(getStoreRoot());
    const characters = $derived(getCharacters());

    const populatedStats = writable(new CharacterProfile(''));

    // Controls whether the buttons in the footer are disabled.
    const footerDisabled = $derived($isLoading || !$populatedStats.name);

    function saveCharacterStats() {
        const buffer = get(populatedStats);
        const currentCharactersList = characters;

        // If this character already exists (by name since we won't have an ID to match at this point), update it.
        // Otherwise, add it as new.
        // Note: This means character names must be unique, but that's probably a reasonable constraint, considering they
        // are unique in-game.
        const indexOfThisCharacter = currentCharactersList.findIndex((c: CharacterProfile) => c.name === buffer.name);

        if (indexOfThisCharacter !== -1) {
        const next = [...currentCharactersList];
        next[indexOfThisCharacter] = { ...next[indexOfThisCharacter], skillLevels: buffer.skillLevels };
        characterStore.characters = next;
        } else {
        characterStore.characters = [...currentCharactersList, buffer];
        }

        // Set this character as active, show a toast to the user, and notify parent component of selection.
        characterStore.activeCharacter = buffer.id;
        toast.success(`Character "${buffer.name}" has been created.`);
        onCharacterSelected();

        // Close the dialog.
        onClose();
    }

    function deepClone<T>(v: T): T {
        try {
            // structuredClone can throw DataCloneError for class instances or uncloneable values
            return structuredClone(v as unknown as object) as unknown as T;
        } catch {
            // Fallback for plain data; note: this will drop methods
            return JSON.parse(JSON.stringify(v)) as T;
        }
    }

    async function handleImportClick(): Promise<void> {
        isLoading.set(true);

        try {
            const character = await fetchCharacterDetailsFromWOM($populatedStats.name);
            populatedStats.set(character);
        } catch (e) {
            toast.error(`Failed to import character "${$populatedStats.name}". Please check the name and try again.`);
            console.error(e);
        } finally {
            isLoading.set(false);
        }
    }
</script>

<Dialog.Root bind:open={$open}>
    <Dialog.Trigger class="w-full overflow-x-hidden {triggerClass}">
        {@render trigger?.()}
    </Dialog.Trigger>

    <Dialog.Content>
        <Dialog.Header class={padding}>
            <Dialog.Title>
                Skill levels:
                <span class="text-primary">
                    {$populatedStats.name ? $populatedStats.name : 'New character'}
                </span>
            </Dialog.Title>
            <Dialog.Description>Enter your skills manually or import them from skill trackers.</Dialog.Description>
        </Dialog.Header>

        <form
            class="flex flex-col gap-6"
            onsubmit={(saveCharacterStats)}
        >
            <div class="max-h-[35vh] overflow-auto pb-1 flex flex-col gap-6 {padding}">
                <div>
                    <Label class="capitalize text-xs" for="character-name">Character name</Label>
                    <Input id="character-name" type="text" required aria-required bind:value={$populatedStats.name} />
                </div>
                <div class="flex flex-col gap-6">
                    <div class="grid grid-cols-3 gap-6">
                        <div>
                            <Label class="capitalize text-xs" for="agility">agility</Label>
                            <Input
                                id="agility"
                                type="number"
                                bind:value={$populatedStats.skillLevels.agility}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="attack">attack</Label>
                            <Input
                                id="attack"
                                type="number"
                                bind:value={$populatedStats.skillLevels.attack}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="construction">construction</Label>
                            <Input
                                id="construction"
                                type="number"
                                bind:value={$populatedStats.skillLevels.construction}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="cooking">cooking</Label>
                            <Input
                                id="cooking"
                                type="number"
                                bind:value={$populatedStats.skillLevels.cooking}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="crafting">crafting</Label>
                            <Input
                                id="crafting"
                                type="number"
                                bind:value={$populatedStats.skillLevels.crafting}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="defence">defence</Label>
                            <Input
                                id="defence"
                                type="number"
                                bind:value={$populatedStats.skillLevels.defence}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="farming">farming</Label>
                            <Input
                                id="farming"
                                type="number"
                                bind:value={$populatedStats.skillLevels.farming}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="firemaking">firemaking</Label>
                            <Input
                                id="firemaking"
                                type="number"
                                bind:value={$populatedStats.skillLevels.firemaking}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="fishing">fishing</Label>
                            <Input
                                id="fishing"
                                type="number"
                                bind:value={$populatedStats.skillLevels.fishing}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="fletching">fletching</Label>
                            <Input
                                id="fletching"
                                type="number"
                                bind:value={$populatedStats.skillLevels.fletching}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="herblore">herblore</Label>
                            <Input
                                id="herblore"
                                type="number"
                                bind:value={$populatedStats.skillLevels.herblore}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="hitpoints">hitpoints</Label>
                            <Input
                                id="hitpoints"
                                type="number"
                                bind:value={$populatedStats.skillLevels.hitpoints}
                                min={10}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="hunter">hunter</Label>
                            <Input
                                id="hunter"
                                type="number"
                                bind:value={$populatedStats.skillLevels.hunter}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="magic">magic</Label>
                            <Input
                                id="magic"
                                type="number"
                                bind:value={$populatedStats.skillLevels.magic}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="mining">mining</Label>
                            <Input
                                id="mining"
                                type="number"
                                bind:value={$populatedStats.skillLevels.mining}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="prayer">prayer</Label>
                            <Input
                                id="prayer"
                                type="number"
                                bind:value={$populatedStats.skillLevels.prayer}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="ranged">ranged</Label>
                            <Input
                                id="ranged"
                                type="number"
                                bind:value={$populatedStats.skillLevels.ranged}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="runecrafting">runecrafting</Label>
                            <Input
                                id="runecrafting"
                                type="number"
                                bind:value={$populatedStats.skillLevels.runecrafting}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="slayer">slayer</Label>
                            <Input
                                id="slayer"
                                type="number"
                                bind:value={$populatedStats.skillLevels.slayer}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="smithing">smithing</Label>
                            <Input
                                id="smithing"
                                type="number"
                                bind:value={$populatedStats.skillLevels.smithing}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="strength">strength</Label>
                            <Input
                                id="strength"
                                type="number"
                                bind:value={$populatedStats.skillLevels.strength}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="thieving">thieving</Label>
                            <Input
                                id="thieving"
                                type="number"
                                bind:value={$populatedStats.skillLevels.thieving}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                        <div>
                            <Label class="capitalize text-xs" for="woodcutting">woodcutting</Label>
                            <Input
                                id="woodcutting"
                                type="number"
                                bind:value={$populatedStats.skillLevels.woodcutting}
                                min={1}
                                inputmode="numeric"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <Footer class={padding}>
                <Button
                    class="capitalize"
                    variant="ghost"
                    disabled={footerDisabled}
                    onclick={async () => await handleImportClick()}
                >
                    {#if $isLoading}
                        <Loader2Icon class="animate-spin" />
                        Importing, please wait...
                    {:else}
                        Import {$populatedStats.name ? ` "${$populatedStats.name}"` : ''}
                    {/if}
                </Button>
                <Button type="submit" disabled={footerDisabled}>Submit</Button>
            </Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
