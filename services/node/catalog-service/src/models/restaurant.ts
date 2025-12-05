import { Schema, model, type Document } from 'mongoose';

export interface DeliveryEta {
  min: number;
  max: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RestaurantAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country?: string;
  zip: string;
  coordinates?: Coordinates;
}

export interface RestaurantDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  cuisines: string[];
  tags: string[];
  imageUrl?: string;
  avgCostForTwo: number;
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  isArchived: boolean;
  deliveryEtaMins: DeliveryEta;
  address: RestaurantAddress;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<RestaurantDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true },
    cuisines: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    imageUrl: { type: String },
    avgCostForTwo: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    isOpen: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    deliveryEtaMins: {
      min: { type: Number, default: 25 },
      max: { type: Number, default: 35 },
    },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String },
      country: { type: String, default: 'India' },
      zip: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

restaurantSchema.index({ slug: 1 }, { unique: true });
restaurantSchema.index({ 'address.city': 1, isOpen: 1 });
restaurantSchema.index({ cuisines: 1 });
restaurantSchema.index({ tags: 1 });
restaurantSchema.index({ name: 'text', description: 'text', cuisines: 'text', tags: 'text' });

restaurantSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform: (_doc, ret) => {
    // Fastify consumers expect `id` instead of `_id`.
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export const RestaurantModel = model<RestaurantDocument>('Restaurant', restaurantSchema);

