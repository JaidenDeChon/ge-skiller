import { findSkillTreePage } from '$lib/constants/skill-tree-pages';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    const skill = findSkillTreePage(params.skill);
    if (!skill) throw error(404, 'Skill not found');

    return { skill };
};
