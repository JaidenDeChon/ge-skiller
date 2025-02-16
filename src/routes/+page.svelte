<script lang="ts">
    import * as Accordion from '$lib/components/ui/accordion';
    import SiteHero from '$lib/components/homepage/site-hero.svelte';
    import ItemCard from '$lib/components/global/item-card.svelte';
    import ContentToolbar from '$lib/components/global/content-toolbar.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    function getCategoriesOfSkill(skillName: string) {
        return data.gameItemsBySkill.find(category => category.skillName === skillName)?.categories ?? [];
    }
</script>

<SiteHero />

<ContentToolbar />

<div class="content-sizing">
    <!-- For each skill... -->
    {#each data.gameItemsBySkill as skill}
        <div class="my-12">
            <!-- Skill name. -->
            <h3 class="capitalize text-primary">{skill.skillName}</h3>
            <!-- For each category of items in skill... -->
            {#each getCategoriesOfSkill(skill.skillName) as category}
                <!-- Accordion -->
                <Accordion.Root type="multiple" class="w-full">
                    <Accordion.Item value={category.categoryName}>
                        <Accordion.Trigger>{category.categoryName}</Accordion.Trigger>
                        <Accordion.Content>
                            <div class="flex flex-col gap-3">
                                <!-- For each item in category... -->
                                {#each category.items as item}
                                    <ItemCard {item} />
                                {/each}
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            {/each}
        </div>
    {/each}
</div>
