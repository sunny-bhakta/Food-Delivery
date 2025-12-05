import { z } from 'zod';
import env from '../config/env';

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const addressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().default('India').optional(),
  zip: z.string().min(3),
  coordinates: coordinatesSchema.optional(),
});

const deliveryEtaSchema = z
  .object({
    min: z.coerce.number().int().positive(),
    max: z.coerce.number().int().positive(),
  })
  .refine((value) => value.max >= value.min, {
    message: 'max must be greater than or equal to min',
    path: ['max'],
  });

export const createRestaurantSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  slug: z.string().min(1).optional(),
  cuisines: z.array(z.string().min(1)).default([]).optional(),
  tags: z.array(z.string().min(1)).default([]).optional(),
  imageUrl: z.string().url().optional(),
  avgCostForTwo: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().min(0).optional(),
  deliveryEtaMins: deliveryEtaSchema.optional(),
  address: addressSchema,
  isOpen: z.boolean().optional(),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const restaurantsQuerySchema = z.object({
  city: z.string().optional(),
  cuisines: z.string().optional(),
  tags: z.string().optional(),
  q: z.string().optional(),
  isOpen: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(env.MAX_PAGE_SIZE).optional(),
  page: z.coerce.number().int().min(1).optional(),
  sortBy: z.enum(['rating', 'deliveryEta', 'cost']).optional(),
});

const addonSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().min(0),
  isDefault: z.boolean().optional(),
});

export const menuItemBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  currency: z.string().min(3).max(3).default('INR').optional(),
  category: z.string().optional(),
  tags: z.array(z.string().min(1)).default([]).optional(),
  imageUrl: z.string().url().optional(),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  spiceLevel: z.enum(['mild', 'medium', 'hot']).optional(),
  addons: z.array(addonSchema).default([]).optional(),
  calories: z.coerce.number().min(0).optional(),
});

export const menuItemsQuerySchema = z.object({
  restaurantId: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  q: z.string().optional(),
  isVeg: z.coerce.boolean().optional(),
  isAvailable: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(env.MAX_PAGE_SIZE).optional(),
  page: z.coerce.number().int().min(1).optional(),
  sortBy: z.enum(['price', 'name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const restaurantMenuItemsQuerySchema = menuItemsQuerySchema.omit({ restaurantId: true });

export const updateMenuItemBodySchema = menuItemBodySchema.partial();

