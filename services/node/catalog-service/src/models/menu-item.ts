import { Schema, model, type Document, type Types } from 'mongoose';

export interface MenuItemAddon {
  name: string;
  price: number;
  isDefault?: boolean;
}

export type SpiceLevel = 'mild' | 'medium' | 'hot';

export interface MenuItemDocument extends Document {
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  tags: string[];
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  isArchived: boolean;
  spiceLevel?: SpiceLevel;
  addons: MenuItemAddon[];
  calories?: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<MenuItemDocument>(
  {
    restaurantId: { type: Schema.Types.ObjectId, required: true, ref: 'Restaurant', index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    category: { type: String, trim: true },
    tags: { type: [String], default: [] },
    imageUrl: { type: String },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    spiceLevel: { type: String, enum: ['mild', 'medium', 'hot'], required: false },
    addons: {
      type: [
        {
          name: { type: String, required: true },
          price: { type: Number, required: true, min: 0 },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    calories: { type: Number, min: 0 },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

menuItemSchema.index({ name: 'text', description: 'text', tags: 'text', category: 'text' });
menuItemSchema.index({ restaurantId: 1, category: 1, isArchived: 1 });
menuItemSchema.index({ isVeg: 1, isAvailable: 1 });

menuItemSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const MenuItemModel = model<MenuItemDocument>('MenuItem', menuItemSchema);

