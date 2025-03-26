<script lang="ts">
    import { onMount } from 'svelte';
    import { get, writable } from 'svelte/store';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Footer } from '$lib/components/ui/dialog';
    import { CharacterProfile } from '$lib/models/player-stats';
    import { characterStore } from '$lib/stores/character-store';

    const { populateCurrentCharacter = true }: { populateCurrentCharacter?: boolean } = $props();

    const newCharacterStats = writable(new CharacterProfile(''));

    // Populate the newCharacterStats with the currently-selected character if there is one.
    onMount(() => {
        if (!populateCurrentCharacter) return;
        const currentCharacterId = get(characterStore).activeCharacter;
        const currentCharacter = get(characterStore).characters.find((c) => c.id === currentCharacterId);

        if (currentCharacter) newCharacterStats.set(currentCharacter);
    });

    function saveCharacterStats() {
        const characters = [...get(characterStore).characters];
        const thisCharacterExistingData = characters.find(
            (character) => character.name === get(newCharacterStats).name,
        );

        if (thisCharacterExistingData) thisCharacterExistingData.skillLevels = get(newCharacterStats).skillLevels;
        else characters.push(get(newCharacterStats));

        characterStore.set({ activeCharacter: get(newCharacterStats).id, characters });
    }
</script>

<form class="flex flex-col gap-6 xl:p-0">
    <div class="max-h-[35vh] overflow-auto px-4 pb-1 flex flex-col gap-6 lg:px-1">
        <div>
            <Label class="capitalize text-xs" for="character-name">Character name</Label>
            <Input id="character-name" type="text" required aria-required bind:value={$newCharacterStats.name} />
        </div>
        <div class="flex flex-col gap-6">
            <div class="grid grid-cols-3 gap-6">
                <div>
                    <Label class="capitalize text-xs" for="agility">agility</Label>
                    <Input
                        id="agility"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.agility}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="attack">attack</Label>
                    <Input
                        id="attack"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.attack}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="construction">construction</Label>
                    <Input
                        id="construction"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.construction}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="cooking">cooking</Label>
                    <Input
                        id="cooking"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.cooking}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="crafting">crafting</Label>
                    <Input
                        id="crafting"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.crafting}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="defence">defence</Label>
                    <Input
                        id="defence"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.defence}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="farming">farming</Label>
                    <Input
                        id="farming"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.farming}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="firemaking">firemaking</Label>
                    <Input
                        id="firemaking"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.firemaking}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="construction">fishing</Label>
                    <Input
                        id="fishing"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.fishing}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="fletching">fletching</Label>
                    <Input
                        id="fletching"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.fletching}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="herblore">herblore</Label>
                    <Input
                        id="herblore"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.herblore}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="hitpoints">hitpoints</Label>
                    <Input
                        id="hitpoints"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.hitpoints}
                        min={10}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="hunter">hunter</Label>
                    <Input
                        id="hunter"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.hunter}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="magic">magic</Label>
                    <Input
                        id="magic"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.magic}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="mining">mining</Label>
                    <Input
                        id="mining"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.mining}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="prayer">prayer</Label>
                    <Input
                        id="prayer"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.prayer}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="ranged">ranged</Label>
                    <Input
                        id="ranged"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.ranged}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="runecrafting">runecrafting</Label>
                    <Input
                        id="runecrafting"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.runecrafting}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="slayer">slayer</Label>
                    <Input
                        id="slayer"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.slayer}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="smithing">smithing</Label>
                    <Input
                        id="smithing"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.smithing}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="strength">strength</Label>
                    <Input
                        id="strength"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.strength}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="thieving">thieving</Label>
                    <Input
                        id="thieving"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.thieving}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="woodcutting">woodcutting</Label>
                    <Input
                        id="woodcutting"
                        type="number"
                        bind:value={$newCharacterStats.skillLevels.woodcutting}
                        min={1}
                        inputmode="numeric"
                    />
                </div>
            </div>
        </div>
    </div>
    <Footer class="px-4 pb-4 lg:px-0">
        <Button type="submit" onclick={saveCharacterStats}>Submit</Button>
    </Footer>
</form>
