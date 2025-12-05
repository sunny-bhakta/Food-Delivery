# Catalog Service

Fastify + MongoDB microservice that stores restaurants, menus, and discovery-friendly metadata for the food delivery platform.

## Features
- REST API for restaurant CRUD and nested menu-item management
- Text search & filtering for cuisines, tags, dietary preferences, and availability
- Pagination + sorting helpers for list endpoints
- MongoDB (Mongoose) models with indexes tuned for common catalog queries
- Structured validation via Zod with rich error messages

## Prerequisites
- Node.js 18+
- MongoDB 6+ (local instance or connection string)

## Getting started
1. Install dependencies from the repo root (workspaces are hoisted):
   ```bash
   npm install
   ```
2. Copy the sample environment file and adjust as needed:
   ```bash
   cp services/node/catalog-service/env.example services/node/catalog-service/.env
   ```
3. Start the service in watch mode:
   ```bash
   npm run dev --workspace services/node/catalog-service
   ```
4. Or build & run the compiled output:
   ```bash
   npm run build --workspace services/node/catalog-service
   npm run start --workspace services/node/catalog-service
   ```

## Environment variables
| Name | Default | Description |
| --- | --- | --- |
| `PORT` | `4001` | HTTP port for the Fastify server |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017` | Mongo connection string |
| `MONGODB_DB` | `food-catalog` | Database name used by the service |
| `DEFAULT_PAGE_SIZE` | `20` | Fallback number of rows per page |
| `MAX_PAGE_SIZE` | `50` | Maximum page size allowed for list endpoints |
| `AUTH_JWT_SECRET` | `changeme-in-dev` | Symmetric secret used to verify JWTs issued by `auth-service` |
| `AUTH_JWT_ISSUER` | _(optional)_ | Expected JWT issuer (set if you configured one in `auth-service`) |
| `AUTH_JWT_AUDIENCE` | _(optional)_ | Expected JWT audience |
| `AUTH_DISABLED` | `false` | Skip verification and inject a fake user (dev-only) |

## Authentication

Every route other than `/health` now requires a valid `Authorization: Bearer <token>` header. Tokens are signed by `services/node/auth-service` using the same `AUTH_JWT_SECRET`, so make sure the two services share that value in `.env`.

For quick local testing you can set `AUTH_DISABLED=true`, which bypasses verification and injects a stub user. **Never enable this in shared/dev/prod environments.**

To obtain a token, call the auth-service login endpoint:

```bash
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@foodapp.test","password":"hunter2"}'
```

Use the returned `accessToken` in your catalog-service requests.

## API overview

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health probe with DB connectivity flag |
| `GET` | `/restaurants` | List/search restaurants (filters: city, cuisines, tags, rating, open) |
| `POST` | `/restaurants` | Create a restaurant with address + delivery SLA details |
| `GET` | `/restaurants/:idOrSlug` | Fetch a single restaurant by Mongo ObjectId or slug |
| `PATCH` | `/restaurants/:idOrSlug` | Partial update for restaurant metadata |
| `GET` | `/restaurants/:idOrSlug/menu-items` | List menu items for a restaurant with price/diet filters |
| `POST` | `/restaurants/:idOrSlug/menu-items` | Create a menu item scoped to a restaurant |
| `PATCH` | `/restaurants/:idOrSlug/menu-items/:menuItemId` | Edit an existing menu item |
| `DELETE` | `/restaurants/:idOrSlug/menu-items/:menuItemId` | Soft-delete (archive) a menu item |
| `GET` | `/menu-items` | Cross-restaurant menu search (tags, price bands, veg, availability) |
| `GET` | `/menu-items/:menuItemId` | Fetch a specific menu item by id |

## Response DTOs

All endpoints (except `/health`) now return structured DTOs so downstream clients can depend on a stable shape with ISO-8601 timestamps.

**RestaurantDTO**
```json
{
  "id": "65f1c6...",
  "name": "Spice Route",
  "slug": "spice-route",
  "cuisines": ["Indian", "Thai"],
  "tags": ["spicy", "family-meal"],
  "avgCostForTwo": 700,
  "rating": 4.6,
  "reviewCount": 218,
  "isOpen": true,
  "deliveryEtaMins": { "min": 25, "max": 40 },
  "address": {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "zip": "560001"
  },
  "createdAt": "2025-01-12T08:22:51.120Z",
  "updatedAt": "2025-01-12T08:22:51.120Z"
}
```

**MenuItemDTO**
```json
{
  "id": "65f1c7...",
  "restaurantId": "65f1c6...",
  "name": "Paneer Tikka Bowl",
  "price": 280,
  "currency": "INR",
  "category": "Bowls",
  "isVeg": true,
  "isAvailable": true,
  "addons": [
    { "name": "Extra Paneer", "price": 60, "isDefault": false }
  ],
  "createdAt": "2025-01-12T08:24:02.991Z",
  "updatedAt": "2025-01-12T08:24:02.991Z"
}
```

Paginated endpoints also include a `meta` block with `{ "page", "pageSize", "total", "totalPages" }`.

### Example requests

Create a restaurant:
```bash
curl -X POST http://localhost:4001/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Spice Route",
    "cuisines": ["Indian", "Thai"],
    "tags": ["spicy", "family-meal"],
    "avgCostForTwo": 700,
    "deliveryEtaMins": { "min": 25, "max": 40 },
    "address": {
      "line1": "12 MG Road",
      "city": "Bengaluru",
      "state": "KA",
      "zip": "560001"
    }
  }'
```

Add a menu item to that restaurant:
```bash
curl -X POST http://localhost:4001/restaurants/spice-route/menu-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Paneer Tikka Bowl",
    "price": 280,
    "category": "Bowls",
    "isVeg": true,
    "tags": ["high-protein"],
    "addons": [
      { "name": "Extra Paneer", "price": 60 },
      { "name": "Mint Chutney", "price": 20 }
    ]
  }'
```

Search for vegetarian bowls under ₹300:
```bash
curl "http://localhost:4001/menu-items?q=Paneer&isVeg=true&maxPrice=300&category=Bowls" \
  -H "Authorization: Bearer $TOKEN"
```

Use these endpoints from the API Gateway or directly during local development to power restaurant discovery screens, menu browsers, and merchandising experiences.
