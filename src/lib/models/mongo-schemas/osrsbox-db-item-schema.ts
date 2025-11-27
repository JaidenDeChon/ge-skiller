import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IOsrsboxItem } from '../osrsbox-db-item';

export interface OsrsboxItemDocument extends Omit<Document, 'id'>, IOsrsboxItem {
  highPrice?: number;
  highTime?: number;
  lowPrice?: number;
  lowTime?: number;
}

export const osrsboxItemSchema: Schema<OsrsboxItemDocument> = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    last_updated: { type: String, required: true },
    incomplete: { type: Boolean, required: true },
    members: { type: Boolean, required: true },
    tradeable: { type: Boolean, required: true },
    tradeable_on_ge: { type: Boolean, required: true },
    stackable: { type: Boolean, required: true },
    stacked: { type: Number, default: null },
    noted: { type: Boolean, required: true },
    noteable: { type: Boolean, required: true },
    linked_id_item: { type: Number, default: null },
    linked_id_noted: { type: Number, default: null },
    linked_id_placeholder: { type: Number, default: null },
    placeholder: { type: Boolean, required: true },
    equipable: { type: Boolean, required: true },
    equipable_by_player: { type: Boolean, required: true },
    equipable_weapon: { type: Boolean, required: true },
    cost: { type: Number, required: true },
    lowalch: { type: Number, default: null },
    highalch: { type: Number, default: null },
    weight: { type: Number, default: null },
    buy_limit: { type: Number, default: null },
    quest_item: { type: Boolean, required: true },
    release_date: { type: String, default: null },
    duplicate: { type: Boolean, required: true },
    examine: { type: String, default: null },
    icon: { type: String, required: true },
    wiki_name: { type: String, default: null },
    wiki_url: { type: String, default: null },
    equipment: { type: Schema.Types.Mixed, default: null },
    weapon: { type: Schema.Types.Mixed, default: null },
    highPrice: { type: Number, required: false },
    highTime: { type: Number, required: false },
    lowPrice: { type: Number, required: false },
    lowTime: { type: Number, required: false },
  },
  { collection: 'items' },
);

export const OsrsboxItemModel: Model<OsrsboxItemDocument> =
  mongoose.models.OsrsboxItem || mongoose.model<OsrsboxItemDocument>('OsrsboxItem', osrsboxItemSchema);
