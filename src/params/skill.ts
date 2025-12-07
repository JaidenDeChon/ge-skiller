import { skillTreeSlugs } from '$lib/constants/skill-tree-pages';

export function match(param: string): boolean {
    const normalized = param.trim().toLowerCase();
    return skillTreeSlugs.includes(normalized);
}
