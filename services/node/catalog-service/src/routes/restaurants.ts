import type { FastifyInstance } from 'fastify';
import { Types, type FilterQuery, type SortOrder } from 'mongoose';
import { ZodError, type z } from 'zod';
import env from '../config/env';
import { buildPaginationMeta } from '../dto/pagination';
import { toMenuItemDTO } from '../dto/menu-item';
import { toRestaurantDTO } from '../dto/restaurant';
import { MenuItemModel, type MenuItemDocument } from '../models/menu-item';
import { RestaurantModel, type RestaurantDocument } from '../models/restaurant';
import { formatZodError } from '../utils/errors';
import { escapeRegex, sanitizeArray, splitCsv } from '../utils/query';
import { slugify } from '../utils/slug';
import {
  createRestaurantSchema,
  menuItemBodySchema,
  restaurantMenuItemsQuerySchema,
  restaurantsQuerySchema,
  updateMenuItemBodySchema,
  updateRestaurantSchema,
} from './schemas';

const ensureUniqueSlug = async (base: string, currentId?: string) => {
  const normalizedBase = slugify(base);

  if (!normalizedBase) {
    throw new Error('Slug cannot be empty');
  }

  let candidate = normalizedBase;
  let suffix = 1;

  while (true) {
    // eslint-disable-next-line no-await-in-loop -- sequential uniqueness check
    const existing = await RestaurantModel.findOne({ slug: candidate });

    if (!existing || (currentId && existing.id === currentId)) {
      return candidate;
    }

    candidate = `${normalizedBase}-${suffix++}`;
  }
};

const findRestaurantOrThrow = async (app: FastifyInstance, identifier: string) => {
  const filter: FilterQuery<RestaurantDocument> = { isArchived: false };

  if (Types.ObjectId.isValid(identifier)) {
    filter._id = identifier;
  } else {
    filter.slug = identifier.toLowerCase();
  }

  const restaurant = await RestaurantModel.findOne(filter);

  if (!restaurant) {
    throw app.httpErrors.notFound('Restaurant not found');
  }

  return restaurant;
};

const buildMenuItemsFilter = (
  restaurantId: Types.ObjectId,
  query: z.infer<typeof restaurantMenuItemsQuerySchema>
) => {
  const filter: FilterQuery<MenuItemDocument> = {
    restaurantId,
    isArchived: false,
  };

  if (query.category) {
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, 'i');
  }

  const tags = splitCsv(query.tags);
  if (tags.length) {
    filter.tags = {
      $in: tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')),
    };
  }

  if (typeof query.isVeg === 'boolean') {
    filter.isVeg = query.isVeg;
  }

  if (typeof query.isAvailable === 'boolean') {
    filter.isAvailable = query.isAvailable;
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) {
      filter.price.$gte = query.minPrice;
    }
    if (query.maxPrice) {
      filter.price.$lte = query.maxPrice;
    }
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
};

const buildRestaurantFilter = (query: z.infer<typeof restaurantsQuerySchema>) => {
  const filter: FilterQuery<RestaurantDocument> = {
    isArchived: false,
  };

  if (query.city) {
    filter['address.city'] = new RegExp(`^${escapeRegex(query.city)}$`, 'i');
  }

  const cuisines = splitCsv(query.cuisines);
  if (cuisines.length) {
    filter.cuisines = {
      $in: cuisines.map((cuisine) => new RegExp(`^${escapeRegex(cuisine)}$`, 'i')),
    };
  }

  const tags = splitCsv(query.tags);
  if (tags.length) {
    filter.tags = {
      $in: tags.map((tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')),
    };
  }

  if (typeof query.isOpen === 'boolean') {
    filter.isOpen = query.isOpen;
  }

  if (typeof query.minRating === 'number') {
    filter.rating = { $gte: query.minRating };
  }

  if (query.q) {
    filter.$text = { $search: query.q };
  }

  return filter;
};

const getRestaurantSort = (sortBy?: string): Record<string, SortOrder> => {
  switch (sortBy) {
    case 'rating':
      return { rating: -1, reviewCount: -1 };
    case 'deliveryEta':
      return { 'deliveryEtaMins.min': 1 };
    case 'cost':
      return { avgCostForTwo: 1 };
    default:
      return { name: 1 };
  }
};

const getMenuItemSort = (
  sortBy?: z.infer<typeof restaurantMenuItemsQuerySchema>['sortBy'],
  sortOrder?: z.infer<typeof restaurantMenuItemsQuerySchema>['sortOrder']
): Record<string, SortOrder> => {
  const order = sortOrder === 'desc' ? -1 : 1;

  switch (sortBy) {
    case 'price':
      return { price: order };
    case 'createdAt':
      return { createdAt: order };
    case 'name':
    default:
      return { name: order };
  }
};

export const registerRestaurantRoutes = async (app: FastifyInstance) => {
  app.get('/', async (request) => {
    try {
      const query = restaurantsQuerySchema.parse(request.query);
      const pageSize = query.limit ?? env.DEFAULT_PAGE_SIZE;
      const page = query.page ?? 1;
      const filter = buildRestaurantFilter(query);
      const sort = getRestaurantSort(query.sortBy);

      const [restaurants, total] = await Promise.all([
        RestaurantModel.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize),
        RestaurantModel.countDocuments(filter),
      ]);

      return {
        data: restaurants.map(toRestaurantDTO),
        meta: buildPaginationMeta(page, pageSize, total),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw app.httpErrors.badRequest(formatZodError(error));
      }
      throw error;
    }
  });

  app.post('/', async (request, reply) => {
    try {
      const payload = createRestaurantSchema.parse(request.body);
      const slug = await ensureUniqueSlug(payload.slug ?? payload.name);

      const restaurant = await RestaurantModel.create({
        ...payload,
        slug,
        cuisines: sanitizeArray(payload.cuisines),
        tags: sanitizeArray(payload.tags),
      });

      reply.code(201);
      return { data: toRestaurantDTO(restaurant) };
    } catch (error) {
      if (error instanceof ZodError) {
        throw app.httpErrors.badRequest(formatZodError(error));
      }
      throw error;
    }
  });

  app.get('/:restaurantIdOrSlug', async (request) => {
    const { restaurantIdOrSlug } = request.params as { restaurantIdOrSlug: string };
    const restaurant = await findRestaurantOrThrow(app, restaurantIdOrSlug);

    return { data: toRestaurantDTO(restaurant) };
  });

  app.patch('/:restaurantIdOrSlug', async (request) => {
    try {
      const { restaurantIdOrSlug } = request.params as { restaurantIdOrSlug: string };
      const restaurant = await findRestaurantOrThrow(app, restaurantIdOrSlug);
      const payload = updateRestaurantSchema.parse(request.body);
      const updates = Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (Object.keys(updates).length === 0) {
        throw app.httpErrors.badRequest('No fields provided for update');
      }

      if (typeof updates.slug === 'string') {
        updates.slug = await ensureUniqueSlug(updates.slug, restaurant.id);
      }

      if (Array.isArray(updates.cuisines)) {
        updates.cuisines = sanitizeArray(updates.cuisines as string[]);
      }

      if (Array.isArray(updates.tags)) {
        updates.tags = sanitizeArray(updates.tags as string[]);
      }

      const updated = await RestaurantModel.findByIdAndUpdate(restaurant.id, { $set: updates }, { new: true });

      if (!updated) {
        throw app.httpErrors.internalServerError('Failed to update restaurant');
      }

      return { data: toRestaurantDTO(updated) };
    } catch (error) {
      if (error instanceof ZodError) {
        throw app.httpErrors.badRequest(formatZodError(error));
      }
      throw error;
    }
  });

  app.get('/:restaurantIdOrSlug/menu-items', async (request) => {
    try {
      const { restaurantIdOrSlug } = request.params as { restaurantIdOrSlug: string };
      const restaurant = await findRestaurantOrThrow(app, restaurantIdOrSlug);
      const query = restaurantMenuItemsQuerySchema.parse(request.query);
      const pageSize = query.limit ?? env.DEFAULT_PAGE_SIZE;
      const page = query.page ?? 1;
      const filter = buildMenuItemsFilter(restaurant._id, query);
      const sort = getMenuItemSort(query.sortBy, query.sortOrder);

      const [items, total] = await Promise.all([
        MenuItemModel.find(filter).sort(sort).skip((page - 1) * pageSize).limit(pageSize),
        MenuItemModel.countDocuments(filter),
      ]);

      return {
        data: items.map(toMenuItemDTO),
        meta: buildPaginationMeta(page, pageSize, total),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw app.httpErrors.badRequest(formatZodError(error));
      }
      throw error;
    }
  });

  app.post('/:restaurantIdOrSlug/menu-items', async (request, reply) => {
    try {
      const { restaurantIdOrSlug } = request.params as { restaurantIdOrSlug: string };
      const restaurant = await findRestaurantOrThrow(app, restaurantIdOrSlug);
      const payload = menuItemBodySchema.parse(request.body);

      const menuItem = await MenuItemModel.create({
        ...payload,
        restaurantId: restaurant._id,
        currency: (payload.currency ?? 'INR').toUpperCase(),
        tags: sanitizeArray(payload.tags),
        addons:
          payload.addons?.map((addon) => ({
            ...addon,
            name: addon.name.trim(),
          })) ?? [],
      });

      reply.code(201);
      return { data: toMenuItemDTO(menuItem) };
    } catch (error) {
      if (error instanceof ZodError) {
        throw app.httpErrors.badRequest(formatZodError(error));
      }
      throw error;
    }
  });

  app.patch('/:restaurantIdOrSlug/menu-items/:menuItemId', async (request) => {
    try {
      const { restaurantIdOrSlug, menuItemId } = request.params as {
        restaurantIdOrSlug: string;
        menuItemId: string;
      };

      if (!Types.ObjectId.isValid(menuItemId)) {
        throw app.httpErrors.badRequest('menuItemId must be a valid ObjectId');
      }

      const restaurant = await findRestaurantOrThrow(app, restaurantIdOrSlug);
      const payload = updateMenuItemBodySchema.parse(request.body);
      const updates = Object.entries(payload).reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (Object.keys(updates).length === 0) {
        throw app.httpErrors.badRequest('No fields provided for update');
      }

      if (typeof updates.currency === 'string') {
        updates.currency = updates.currency.toUpperCase();
      }

      if (Array.isArray(updates.tags)) {
        updates.tags = sanitizeArray(updates.tags as string[]);
      }

      if (Array.isArray(updates.addons)) {
        updates.addons = (updates.addons as Array<{ name: string }>).map((addon) => ({
          ...addon,
          name: addon.name.trim(),
        }));
      }

      const updated = await MenuItemModel.findOneAndUpdate(
        { _id: menuItemId, restaurantId: restaurant._id, isArchived: false },
        { $set: updates },
        { new: true }
      );

      if (!updated) {
        throw app.httpErrors.notFound('Menu item not found');
      }

      return { data: toMenuItemDTO(updated) };
    } catch (error) {
      if (error instanceof ZodError) {
        throw app.httpErrors.badRequest(formatZodError(error));
      }
      throw error;
    }
  });

  app.delete('/:restaurantIdOrSlug/menu-items/:menuItemId', async (request, reply) => {
    const { restaurantIdOrSlug, menuItemId } = request.params as {
      restaurantIdOrSlug: string;
      menuItemId: string;
    };

    if (!Types.ObjectId.isValid(menuItemId)) {
      throw app.httpErrors.badRequest('menuItemId must be a valid ObjectId');
    }

    const restaurant = await findRestaurantOrThrow(app, restaurantIdOrSlug);

    const result = await MenuItemModel.findOneAndUpdate(
      { _id: menuItemId, restaurantId: restaurant._id, isArchived: false },
      { $set: { isArchived: true, isAvailable: false } },
      { new: true }
    );

    if (!result) {
      throw app.httpErrors.notFound('Menu item not found');
    }

    reply.code(204).send();
  });
};

