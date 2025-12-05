import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).default(5001),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  SQLITE_DB_PATH: Joi.string().optional(),
  SQLITE_URL: Joi.string().optional(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),
});


