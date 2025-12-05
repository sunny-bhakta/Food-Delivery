import type { MenuItemDocument, SpiceLevel } from '../models/menu-item';

export interface MenuItemAddonDTO {
  name: string;
  price: number;
  isDefault: boolean;
}

export interface MenuItemDTO {
  id: string;
  restaurantId: string;
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
  addons: MenuItemAddonDTO[];
  calories?: number;
  createdAt: string;
  updatedAt: string;
}

type MenuItemLike = MenuItemDocument | (MenuItemDTO & { createdAt: Date | string; updatedAt: Date | string });

const normalizeDate = (value: Date | string | undefined): string =>
  value ? new Date(value).toISOString() : new Date().toISOString();
/**
 * Converts a MenuItemLike object (MenuItemDocument or MenuItemDTO) into a plain JavaScript object.
 * 
 * - If the input is a Mongoose document, it calls `.toJSON()` to convert it to a plain object.
 * - If the input is already a DTO-like plain object, it returns it directly.
 * 
 * Example usage:
 * 
 * ```ts
 * // With a Mongoose MenuItemDocument
 * const mongooseMenuItem: MenuItemDocument = ...;
 * const plain = toPlainMenuItem(mongooseMenuItem);
 * // plain is now a simple JS object representation
 * 
 * // With a MenuItemDTO
 * const dto: MenuItemDTO = { id: "1", restaurantId: "r1", name: "Pizza", ... };
 * const plain2 = toPlainMenuItem(dto);
 * // plain2 === dto
 * ```
 * 
 * This function ensures the rest of the DTO conversion works consistently whether the source is
 * from the database (Mongoose) or already a plain/DTO object.
 */
const toPlainMenuItem = (menuItem: MenuItemLike): any => {
  if (menuItem && typeof (menuItem as MenuItemDocument).toJSON === 'function') {
    return (menuItem as MenuItemDocument).toJSON();
  }

  return menuItem;
};

export const toMenuItemDTO = (menuItem: MenuItemLike): MenuItemDTO => {
  const plain = toPlainMenuItem(menuItem);

  return {
    id: plain.id,
    restaurantId: plain.restaurantId?.toString?.() ?? plain.restaurantId,
    name: plain.name,
    description: plain.description,
    price: plain.price ?? 0,
    currency: plain.currency ?? 'INR',
    category: plain.category,
    tags: plain.tags ?? [],
    imageUrl: plain.imageUrl,
    isVeg: Boolean(plain.isVeg),
    isAvailable: Boolean(plain.isAvailable),
    isArchived: Boolean(plain.isArchived),
    spiceLevel: plain.spiceLevel,
    addons:
      plain.addons?.map((addon: MenuItemAddonDTO) => ({
        name: addon.name,
        price: addon.price ?? 0,
        isDefault: Boolean(addon.isDefault),
      })) ?? [],
    calories: plain.calories,
    createdAt: normalizeDate(plain.createdAt),
    updatedAt: normalizeDate(plain.updatedAt),
  };
};

