<script lang="ts">
    import * as Accordion from '$lib/components/ui/accordion';
    import * as Card from '$lib/components/ui/card';
    import SiteHero from '$lib/components/homepage/site-hero.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    function getCategoriesOfSkill(skillName: string) {
        return data.gameItemsBySkill.find(category => category.skillName === skillName)?.categories ?? [];
    }
</script>

<SiteHero />

<div class="content-sizing flex flex-col gap-8 px-8">
    {#each data.gameItemsBySkill as skill}

        <Card.Root class="w-full">
            <Card.Header>
                <Card.Title class="capitalize text-primary">{skill.skillName}</Card.Title>
            </Card.Header>
            <Card.Content>
                {#each getCategoriesOfSkill(skill.skillName) as category}
                    <Accordion.Root type="multiple" class="w-full">
                        <Accordion.Item value={category.categoryName}>
                            <Accordion.Trigger>{category.categoryName}</Accordion.Trigger>
                            <Accordion.Content>
                                {#each category.items as item}
                                    <p>{item.name}</p>
                                {/each}
                            </Accordion.Content>
                        </Accordion.Item>
                    </Accordion.Root>
                {/each}
            </Card.Content>
        </Card.Root>
    {/each}
</div>
