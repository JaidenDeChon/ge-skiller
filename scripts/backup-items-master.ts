import mongoose from 'mongoose';

const user = process.env.VITE_MONGO_USERNAME;
const pw = process.env.VITE_MONGO_PASSWORD;
const cluster = process.env.VITE_MONGO_DB_CLUSTER_NAME;
const host = process.env.VITE_MONGO_DB_HOST;
const dbName = process.env.VITE_MONGO_DB_DB_NAME || 'osrsbox';
const prepend = 'mongodb+srv';
const append = '?retryWrites=true&w=majority';
const connectionString = `${prepend}://${user}:${pw}@${cluster}.${host}/${dbName}${append}`;

const SOURCE_COLLECTION = process.env.OSRSBOX_SOURCE_COLLECTION || 'items';
const TARGET_COLLECTION = process.env.OSRSBOX_BACKUP_COLLECTION || 'items-master';

async function main() {
    if (!user || !pw || !cluster || !host) {
        console.error('[osrsbox-backup] Missing MongoDB env vars.');
        process.exit(1);
    }

    console.log(`[osrsbox-backup] Connecting to MongoDB...`);
    await mongoose.connect(connectionString);

    try {
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('MongoDB connection is not available.');
        }

        const existing = await db.listCollections({ name: TARGET_COLLECTION }).toArray();
        if (existing.length > 0) {
            console.log(
                `[osrsbox-backup] Target collection "${TARGET_COLLECTION}" exists; it will be replaced.`,
            );
        }

        console.log(
            `[osrsbox-backup] Copying "${SOURCE_COLLECTION}" -> "${TARGET_COLLECTION}"...`,
        );

        await db
            .collection(SOURCE_COLLECTION)
            .aggregate([{ $match: {} }, { $out: TARGET_COLLECTION }], { allowDiskUse: true })
            .toArray();

        console.log('[osrsbox-backup] Backup complete.');
    } finally {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    void main();
}
