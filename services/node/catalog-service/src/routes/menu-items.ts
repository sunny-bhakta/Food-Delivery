import type { FastifyInstance } from 'fastify';
import { Types, type FilterQuery, type SortOrder } from 'mongoose';
import { ZodError, type z } from 'zod';
import env from '../config/env';
import { buildPaginationMeta } from '../dto/pagination';
import { toMenuItemDTO } from '../dto/menu-item';
import { MenuItemModel, type MenuItemDocument } from '../models/menu-item';
import { formatZodError } from '../utils/errors';
import { escapeRegex, splitCsv } from '../utils/query';
import { menuItemsQuerySchema } from './schemas';

const buildMenuItemFilter = (query: z.infer<typeof menuItemsQuerySchema>) => {
  const filter: FilterQuery<MenuItemDocument> = {
    isArchived: false,
  };

  if (query.restaurantId) {
    if (!Types.ObjectId.isValid(query.restaurantId)) {
      throw new Error('restaurantId must be a valid ObjectId');
    }
    filter.restaurantId = new Types.ObjectId(query.restaurantId);
  }

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

const getMenuItemSort = (
  sortBy?: z.infer<typeof menuItemsQuerySchema>['sortBy'],
  sortOrder?: z.infer<typeof menuItemsQuerySchema>['sortOrder']
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

export const registerMenuItemRoutes = async (app: FastifyInstance) => {
  app.get('/', async (request) => {
    try {
      const query = menuItemsQuerySchema.parse(request.query);
      const pageSize = query.limit ?? env.DEFAULT_PAGE_SIZE;
      const page = query.page ?? 1;
      const filter = buildMenuItemFilter(query);
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
      if (error instanceof Error && error.message.includes('ObjectId')) {
        throw app.httpErrors.badRequest(error.message);
      }
      throw error;
    }
  });

  app.get('/:menuItemId', async (request) => {
    const { menuItemId } = request.params as { menuItemId: string };

    if (!Types.ObjectId.isValid(menuItemId)) {
      throw app.httpErrors.badRequest('menuItemId must be a valid ObjectId');
    }

    const menuItem = await MenuItemModel.findOne({ _id: menuItemId, isArchived: false });

    if (!menuItem) {
      throw app.httpErrors.notFound('Menu item not found');
    }

    return { data: toMenuItemDTO(menuItem) };
  });
};

