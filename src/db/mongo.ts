import mongoose from 'mongoose';

const useImportMetaEnv = typeof import.meta !== 'undefined' && import.meta.env;
const useProcessEnv = typeof process !== 'undefined' && process.env;

function getEnvVariable(key: string): string | undefined {
    if (useImportMetaEnv && key in import.meta.env) return import.meta.env[key];
    else if (useProcessEnv) return process.env[key];
    return undefined;
}

const user = getEnvVariable('VITE_MONGO_USERNAME') || '';
const pw = getEnvVariable('VITE_MONGO_PASSWORD') || '';
const cluster = getEnvVariable('VITE_MONGO_DB_CLUSTER_NAME') || '';
const host = getEnvVariable('VITE_MONGO_DB_HOST') || '';
const dbName = getEnvVariable('VITE_MONGO_DB_DB_NAME') || '';

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
