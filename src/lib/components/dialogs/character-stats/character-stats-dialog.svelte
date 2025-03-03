<script lang="ts">
    import { get } from 'svelte/store';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Footer } from '$lib/components/ui/dialog';
    import { CharacterProfile } from '$lib/models/player-stats';
    import { skillsStore } from '$lib/stores/skills-store';

    const { characterStats }: { characterStats: CharacterProfile } = $props();

    let name = $state('');
    let agility = $state(1);
    let attack = $state(1);
    let construction = $state(1);
    let cooking = $state(1);
    let crafting = $state(1);
    let defence = $state(1);
    let farming = $state(1);
    let firemaking = $state(1);
    let fishing = $state(1);
    let fletching = $state(1);
    let herblore = $state(1);
    let hitpoints = $state(10);
    let hunter = $state(1);
    let magic = $state(1);
    let mining = $state(1);
    let prayer = $state(1);
    let ranged = $state(1);
    let runecrafting = $state(1);
    let slayer = $state(1);
    let smithing = $state(1);
    let strength = $state(1);
    let thieving = $state(1);
    let woodcutting = $state(1);

    function saveCharacterStats() {
        const characters = [...get(skillsStore).characters];
        const thisCharacterExistingData = characters.find((character) => character.name === name);

        const skillLevels = {
            ...thisCharacterExistingData?.skillLevels,
            agility,
            attack,
            construction,
            cooking,
            crafting,
            defence,
            farming,
            firemaking,
            fishing,
            fletching,
            herblore,
            hitpoints,
            hunter,
            magic,
            mining,
            prayer,
            ranged,
            runecrafting,
            slayer,
            smithing,
            strength,
            thieving,
            woodcutting,
        };

        if (thisCharacterExistingData) thisCharacterExistingData.skillLevels = skillLevels;
        else characters.push(new CharacterProfile(name, skillLevels));

        skillsStore.set({ characters });
    }
</script>

<form class="flex flex-col gap-6 xl:p-0">
    <div class="max-h-[35vh] overflow-auto px-4 pb-1 flex flex-col gap-6 lg:px-1">
        <div>
            <Label class="capitalize text-xs" for="character-name">Character name</Label>
            <Input id="character-name" type="text" required aria-required bind:value={name} />
        </div>
        <div class="flex flex-col gap-6">
            <div class="grid grid-cols-3 gap-6">
                <div>
                    <Label class="capitalize text-xs" for="agility">agility</Label>
                    <Input id="agility" type="number" bind:value={agility} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="attack">attack</Label>
                    <Input id="attack" type="number" bind:value={attack} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="construction">construction</Label>
                    <Input id="construction" type="number" bind:value={construction} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="cooking">cooking</Label>
                    <Input id="cooking" type="number" bind:value={cooking} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="crafting">crafting</Label>
                    <Input id="crafting" type="number" bind:value={crafting} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="defence">defence</Label>
                    <Input id="defence" type="number" bind:value={defence} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="farming">farming</Label>
                    <Input id="farming" type="number" bind:value={farming} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="firemaking">firemaking</Label>
                    <Input id="firemaking" type="number" bind:value={firemaking} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="construction">fishing</Label>
                    <Input id="fishing" type="number" bind:value={fishing} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="fletching">fletching</Label>
                    <Input id="fletching" type="number" bind:value={fletching} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="herblore">herblore</Label>
                    <Input id="herblore" type="number" bind:value={herblore} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="hitpoints">hitpoints</Label>
                    <Input id="hitpoints" type="number" bind:value={hitpoints} min={10} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="hunter">hunter</Label>
                    <Input id="hunter" type="number" bind:value={hunter} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="magic">magic</Label>
                    <Input id="magic" type="number" bind:value={magic} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="mining">mining</Label>
                    <Input id="mining" type="number" bind:value={mining} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="prayer">prayer</Label>
                    <Input id="prayer" type="number" bind:value={prayer} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="ranged">ranged</Label>
                    <Input id="ranged" type="number" bind:value={ranged} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="runecrafting">runecrafting</Label>
                    <Input id="runecrafting" type="number" bind:value={runecrafting} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="slayer">slayer</Label>
                    <Input id="slayer" type="number" bind:value={slayer} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="smithing">smithing</Label>
                    <Input id="smithing" type="number" bind:value={smithing} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="strength">strength</Label>
                    <Input id="strength" type="number" bind:value={strength} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="thieving">thieving</Label>
                    <Input id="thieving" type="number" bind:value={thieving} min={1} inputmode="numeric" />
                </div>
                <div>
                    <Label class="capitalize text-xs" for="woodcutting">woodcutting</Label>
                    <Input id="woodcutting" type="number" bind:value={woodcutting} min={1} inputmode="numeric" />
                </div>
            </div>
        </div>
    </div>
    <Footer class="px-4 pb-4 lg:px-0">
        <Button type="submit" onclick={saveCharacterStats}>Submit</Button>
    </Footer>
</form>
