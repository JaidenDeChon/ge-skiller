<script lang="ts">
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import type { ICharacterProfile } from '$lib/models/player-stats';

    const { skillLevels, idPrefix = '' }: { skillLevels: ICharacterProfile['skillLevels']; idPrefix?: string } = $props();
    const prefix = $derived(idPrefix ? `${idPrefix}-` : '');
</script>

<div class="grid grid-cols-3 gap-6">
    <div>
        <Label class="capitalize text-xs" for={`${prefix}agility`}>agility</Label>
        <Input
            id={`${prefix}agility`}
            type="number"
            bind:value={skillLevels.agility}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}attack`}>attack</Label>
        <Input
            id={`${prefix}attack`}
            type="number"
            bind:value={skillLevels.attack}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}construction`}>construction</Label>
        <Input
            id={`${prefix}construction`}
            type="number"
            bind:value={skillLevels.construction}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}cooking`}>cooking</Label>
        <Input
            id={`${prefix}cooking`}
            type="number"
            bind:value={skillLevels.cooking}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}crafting`}>crafting</Label>
        <Input
            id={`${prefix}crafting`}
            type="number"
            bind:value={skillLevels.crafting}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}defence`}>defence</Label>
        <Input
            id={`${prefix}defence`}
            type="number"
            bind:value={skillLevels.defence}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}farming`}>farming</Label>
        <Input
            id={`${prefix}farming`}
            type="number"
            bind:value={skillLevels.farming}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}firemaking`}>firemaking</Label>
        <Input
            id={`${prefix}firemaking`}
            type="number"
            bind:value={skillLevels.firemaking}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}fishing`}>fishing</Label>
        <Input
            id={`${prefix}fishing`}
            type="number"
            bind:value={skillLevels.fishing}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}fletching`}>fletching</Label>
        <Input
            id={`${prefix}fletching`}
            type="number"
            bind:value={skillLevels.fletching}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}herblore`}>herblore</Label>
        <Input
            id={`${prefix}herblore`}
            type="number"
            bind:value={skillLevels.herblore}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}hitpoints`}>hitpoints</Label>
        <Input
            id={`${prefix}hitpoints`}
            type="number"
            bind:value={skillLevels.hitpoints}
            min={10}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}hunter`}>hunter</Label>
        <Input
            id={`${prefix}hunter`}
            type="number"
            bind:value={skillLevels.hunter}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}magic`}>magic</Label>
        <Input
            id={`${prefix}magic`}
            type="number"
            bind:value={skillLevels.magic}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}mining`}>mining</Label>
        <Input
            id={`${prefix}mining`}
            type="number"
            bind:value={skillLevels.mining}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}prayer`}>prayer</Label>
        <Input
            id={`${prefix}prayer`}
            type="number"
            bind:value={skillLevels.prayer}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}ranged`}>ranged</Label>
        <Input
            id={`${prefix}ranged`}
            type="number"
            bind:value={skillLevels.ranged}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}runecrafting`}>runecrafting</Label>
        <Input
            id={`${prefix}runecrafting`}
            type="number"
            bind:value={skillLevels.runecrafting}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}slayer`}>slayer</Label>
        <Input
            id={`${prefix}slayer`}
            type="number"
            bind:value={skillLevels.slayer}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}smithing`}>smithing</Label>
        <Input
            id={`${prefix}smithing`}
            type="number"
            bind:value={skillLevels.smithing}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}strength`}>strength</Label>
        <Input
            id={`${prefix}strength`}
            type="number"
            bind:value={skillLevels.strength}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}thieving`}>thieving</Label>
        <Input
            id={`${prefix}thieving`}
            type="number"
            bind:value={skillLevels.thieving}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
    <div>
        <Label class="capitalize text-xs" for={`${prefix}woodcutting`}>woodcutting</Label>
        <Input
            id={`${prefix}woodcutting`}
            type="number"
            bind:value={skillLevels.woodcutting}
            min={1}
            max="99"
            inputmode="numeric"
        />
    </div>
</div>
