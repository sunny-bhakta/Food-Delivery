import { join } from 'path';

export interface DatabaseConfig {
  path: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
}

const normalizeSqlitePath = (provided?: string) => {
  if (!provided) {
    return join(process.cwd(), 'auth-service.sqlite');
  }

  if (provided.startsWith('sqlite:///')) {
    return provided.replace('sqlite:///', '');
  }

  return provided;
};

export default (): AppConfig => ({
  port: Number(process.env.PORT ?? 5001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    path: normalizeSqlitePath(process.env.SQLITE_DB_PATH ?? process.env.SQLITE_URL),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'changeme-in-dev',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  },
});


