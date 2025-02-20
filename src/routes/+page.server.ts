import fs from 'fs/promises';
import path from 'path';
import { error } from '@sveltejs/kit';

interface HomepageData {
    imageUrl?: string;
}

async function assembleHomepageData(): Promise<HomepageData['imageUrl']> {
    const imagesPath = path.join(process.cwd(), 'static/npc-images');

    try {
        const files = await fs.readdir(imagesPath);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

        if (imageFiles.length === 0) return '';

        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        return `/npc-images/${randomImage}`;
    } catch (err) {
        console.error(err);
        throw error(500, err as any);
    }
}

export async function load(): Promise<HomepageData> {
    const imageUrl = await assembleHomepageData();
    return { imageUrl };
}
