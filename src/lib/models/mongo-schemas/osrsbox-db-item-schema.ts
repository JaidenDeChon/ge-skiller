import mongoose, { Schema, Document, Model } from 'mongoose';
import type { GameItemCreationSpecs } from '../osrsbox-db-item';
import type { IOsrsboxItem } from '../osrsbox-db-item';

import type { Types } from 'mongoose';

export interface ItemCreationRequirement {
  skillName?: string;         // "Smithing", "Herblore"
  skillLevel?: number;        // 63, 99, ...
  experienceAmount?: number;  // XP granted for this action
  description: string;        // full row text, for safety/debug
}

export interface ItemCreationIngredient {
  consumedDuringCreation: boolean;  // true for mats, false for tools
  amount: number;                   // quantity required
  item: Types.ObjectId;             // ref to OsrsboxItem
}

export interface ItemCreationProduct {
  amount: number;        // quantity produced
  item: Types.ObjectId;  // ref to OsrsboxItem (usually “this” item, but not always)
}

export interface ItemCreationMethod {
  methodName?: string;                           // e.g. "Needle", "Costume needle", "Spin Flax"
  requiredSkills: ItemCreationRequirement[];     // inferred from wiki requirements
  experienceGranted: ItemCreationRequirement[];  // if you want to separate “gated by” vs “xp in”
  ingredients: ItemCreationIngredient[];         // mats + tools (tools: consumedDuringCreation=false)
  products: ItemCreationProduct[];               // outputs
}

export interface OsrsboxItemDocument
  extends Omit<Document, 'id'>,
    IOsrsboxItem {
  highPrice?: number;
  highTime?: number;
  lowPrice?: number;
  lowTime?: number;
  creationSpecs?: GameItemCreationSpecs[];
}

const creationIngredientSchema = new Schema<ItemCreationIngredient>(
  {
    consumedDuringCreation: { type: Boolean, required: true },
    amount: { type: Number, required: true },
    item: {
      type: Schema.Types.ObjectId,
      ref: 'OsrsboxItem',
      required: true,
    },
  },
  { _id: false },
);

const creationExperienceSchema = new Schema(
  {
    skillName: { type: String, required: true },
    experienceAmount: { type: Number, required: true },
  },
  { _id: false },
);

const creationRequiredSkillSchema = new Schema(
  {
    skillName: { type: String, required: true },
    skillLevel: { type: Number, required: true },
  },
  { _id: false },
);

const creationSpecsSchema = new Schema<GameItemCreationSpecs>(
  {
    experienceGranted: { type: [creationExperienceSchema], default: [] },
    requiredSkills: { type: [creationRequiredSkillSchema], default: [] },
    ingredients: { type: [creationIngredientSchema], default: [] },
  },
  { _id: false },
);

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
    creationSpecs: { type: [creationSpecsSchema], default: [] },
  },
  { collection: 'items' },
);

export const OsrsboxItemModel: Model<OsrsboxItemDocument> =
  mongoose.models.OsrsboxItem ||
  mongoose.model<OsrsboxItemDocument>('OsrsboxItem', osrsboxItemSchema);
