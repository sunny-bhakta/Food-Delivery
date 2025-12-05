import type { RestaurantDocument } from '../models/restaurant';

export interface RestaurantAddressDTO {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country?: string;
  zip: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DeliveryEtaDTO {
  min: number;
  max: number;
}

export interface RestaurantDTO {
  id: string;
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
  deliveryEtaMins: DeliveryEtaDTO;
  address: RestaurantAddressDTO;
  createdAt: string;
  updatedAt: string;
}

type RestaurantLike = RestaurantDocument | (RestaurantDTO & { createdAt: Date | string; updatedAt: Date | string });

const normalizeDate = (value: Date | string | undefined): string =>
  value ? new Date(value).toISOString() : new Date().toISOString();

const normalizeAddress = (address?: Partial<RestaurantAddressDTO>): RestaurantAddressDTO => ({
  line1: address?.line1 ?? '',
  line2: address?.line2,
  city: address?.city ?? '',
  state: address?.state,
  country: address?.country,
  zip: address?.zip ?? '',
  coordinates: address?.coordinates,
});

const toPlainRestaurant = (restaurant: RestaurantLike): any => {
  if (restaurant && typeof (restaurant as RestaurantDocument).toJSON === 'function') {
    return (restaurant as RestaurantDocument).toJSON();
  }

  return restaurant;
};

export const toRestaurantDTO = (restaurant: RestaurantLike): RestaurantDTO => {
  const plain = toPlainRestaurant(restaurant);

  return {
    id: plain.id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    cuisines: plain.cuisines ?? [],
    tags: plain.tags ?? [],
    imageUrl: plain.imageUrl,
    avgCostForTwo: plain.avgCostForTwo ?? 0,
    rating: plain.rating ?? 0,
    reviewCount: plain.reviewCount ?? 0,
    isOpen: Boolean(plain.isOpen),
    isArchived: Boolean(plain.isArchived),
    deliveryEtaMins: {
      min: plain.deliveryEtaMins?.min ?? 0,
      max: plain.deliveryEtaMins?.max ?? 0,
    },
    address: normalizeAddress(plain.address),
    createdAt: normalizeDate(plain.createdAt),
    updatedAt: normalizeDate(plain.updatedAt),
  };
};

