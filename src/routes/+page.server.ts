import fs from 'fs/promises';
import path from 'path';
import { error } from '@sveltejs/kit';

interface HomepageData {
    imageUrl?: string;
}

export async function load(): Promise<HomepageData> {
    const imagesPath = path.join(process.cwd(), 'static/npc-images');
    const homepageData: HomepageData = {};

    try {
        const files = await fs.readdir(imagesPath);
        const imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

        if (imageFiles.length === 0) return homepageData;

        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        homepageData.imageUrl = `/npc-images/${randomImage}`;

        return homepageData;
    } catch (err) {
        console.error(err);
        throw error(500, 'Something went wrong while retrieving your image.');
    }
}