export type SkillTreePage = {
    title: string;
    slug: string;
    icon: string;
};

export const skillTreePages: SkillTreePage[] = [
    { title: 'Cooking', slug: 'cooking', icon: '/skill-images/cooking.png' },
    { title: 'Crafting', slug: 'crafting', icon: '/skill-images/crafting.png' },
    { title: 'Fletching', slug: 'fletching', icon: '/skill-images/fletching.png' },
    { title: 'Herblore', slug: 'herblore', icon: '/skill-images/herblore.png' },
    { title: 'Smithing', slug: 'smithing', icon: '/skill-images/smithing.png' },
    { title: 'Woodcutting', slug: 'woodcutting', icon: '/skill-images/woodcutting.png' },
];

export const skillTreeSlugs = skillTreePages.map(({ slug }) => slug);

export function findSkillTreePage(slug?: string | null): SkillTreePage | undefined {
    if (!slug) return undefined;
    const normalized = slug.trim().toLowerCase();
    return skillTreePages.find((skill) => skill.slug === normalized);
}
