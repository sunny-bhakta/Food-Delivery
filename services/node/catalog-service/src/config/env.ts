import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4001),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').default('mongodb://127.0.0.1:27017'),
  MONGODB_DB: z.string().min(1, 'MONGODB_DB is required').default('food-catalog'),
  DEFAULT_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(20),
  MAX_PAGE_SIZE: z.coerce.number().int().min(20).max(200).default(50),
  AUTH_JWT_SECRET: z.string().min(8, 'AUTH_JWT_SECRET must be provided').default('dev-shared-secret'),
  AUTH_JWT_ISSUER: z.string().optional(),
  AUTH_JWT_AUDIENCE: z.string().optional(),
  AUTH_DISABLED: z
    .union([z.boolean(), z.string()])
    .transform((value) => (typeof value === 'string' ? value === 'true' : value))
    .default(false),
});

const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB: process.env.MONGODB_DB,
  DEFAULT_PAGE_SIZE: process.env.DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE: process.env.MAX_PAGE_SIZE,
  AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
  AUTH_JWT_ISSUER: process.env.AUTH_JWT_ISSUER,
  AUTH_JWT_AUDIENCE: process.env.AUTH_JWT_AUDIENCE,
  AUTH_DISABLED: process.env.AUTH_DISABLED,
});

export type Env = z.infer<typeof envSchema>;

export default env;

