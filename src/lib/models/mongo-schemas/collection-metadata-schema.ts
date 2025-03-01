import mongoose from 'mongoose'

export interface ICollectionMetadata {
    collectionName: string;
    lastUpdated: number;
}

const MetadataSchema = new mongoose.Schema<ICollectionMetadata>({
    collectionName: String,
    lastUpdated: {
        type: Number,
        default: Date.now
    }
});

let CollectionMetadataModel: mongoose.Model<ICollectionMetadata>;

if (mongoose.models.Metadata) {
    CollectionMetadataModel = mongoose.models.Metadata;
} else {
    CollectionMetadataModel = mongoose.model('Metadata', MetadataSchema, 'metadata');
}

export { CollectionMetadataModel };
