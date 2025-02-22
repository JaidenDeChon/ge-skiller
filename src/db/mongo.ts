import mongoose from 'mongoose';

let user: string;
let pw: string;
let cluster: string;
let host: string;
let dbName: string;

if (import.meta.env.PROD) {
    user = process.env.VITE_MONGO_USERNAME ?? '';
    pw = process.env.VITE_MONGO_PASSWORD ?? '';
    cluster = process.env.VITE_MONGO_DB_CLUSTER_NAME ?? '';
    host = process.env.VITE_MONGO_DB_HOST ?? '';
    dbName = process.env.VITE_MONGO_DB_DB_NAME ?? '';
} else {
    user = import.meta.env.VITE_MONGO_USERNAME ?? '';
    pw = import.meta.env.VITE_MONGO_PASSWORD ?? '';
    cluster = import.meta.env.VITE_MONGO_DB_CLUSTER_NAME ?? '';
    host = import.meta.env.VITE_MONGO_DB_HOST ?? '';
    dbName = import.meta.env.VITE_MONGO_DB_DB_NAME ?? '';
}

// MongoDB connection string setup.
const prepend = 'mongodb+srv';
const append = '?retryWrites=true&w=majority';
const connectionString = `${prepend}://${user}:${pw}@${cluster}.${host}/${dbName}${append}`;

export async function startMongo(): Promise<void> {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(connectionString);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

export const db = mongoose.connection;
