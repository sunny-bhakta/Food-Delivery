import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  CATALOG_SERVICE_URL: Joi.string().uri().optional(),
  DISPATCH_SERVICE_URL: Joi.string().uri().optional(),
  NOTIFICATIONS_SERVICE_URL: Joi.string().uri().optional(),
  AUTH_SERVICE_URL: Joi.string().uri().optional(),
  PAYMENTS_SERVICE_URL: Joi.string().uri().optional(),
});

