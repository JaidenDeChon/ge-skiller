import { error } from '@sveltejs/kit';
import { populateIngredientsTree } from '$lib/services/game-item-mongo-service.server';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get('id');
    if (!id) {
        console.error('id was null');
        error(404);
    }

    try {
        const gameItems = await populateIngredientsTree(id);
        const json = safeStringify(gameItems);
        return new Response(json, { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : 'Failed to serialize game item tree (possible circular reference).';
        console.error('[game-item-full-tree] serialization error:', err);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

function safeStringify(value: unknown): string {
    detectCircular(value);
    const json = JSON.stringify(value);
    return json ?? 'null';
}

function detectCircular(value: unknown) {
    const seen = new WeakMap<object, string[]>();

    function traverse(val: unknown, path: string[]) {
        if (!val || typeof val !== 'object') return;

        const label = describeObject(val as Record<string, unknown>);
        const currentPath = [...path, label];

        const existingPath = seen.get(val as object);
        if (existingPath) {
            const chain = [...existingPath, label];
            const uniqueNodes = Array.from(new Set(chain));
            const lines = uniqueNodes.map((entry) => `- ${entry}`);
            throw new Error(
                `Circular reference path:\n${lines.join('\n')}\nFix these items' creationSpecs/ingredients in the database.`,
            );
        }

        seen.set(val as object, currentPath);

        if (Array.isArray(val)) {
            val.forEach((child) => traverse(child, currentPath));
        } else {
            for (const [, child] of Object.entries(val)) {
                // Only descend into object/array children and skip primitive props
                if (child && typeof child === 'object') {
                    traverse(child, currentPath);
                }
            }
        }
    }

    traverse(value, ['root']);
}

function describeObject(obj: Record<string, unknown>): string {
    const id = obj._id ?? obj.id;
    const name = obj.name ?? obj.wiki_name;
    const parts: string[] = [];
    if (name) parts.push(String(name));
    if (id) parts.push(`(${String(id)})`);
    return parts.length ? parts.join(' ') : (obj.constructor?.name ?? 'object');
}
