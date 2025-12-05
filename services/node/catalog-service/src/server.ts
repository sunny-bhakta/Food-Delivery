import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import env from './config/env';
import { connectToDatabase, disconnectFromDatabase, isDatabaseConnected } from './lib/mongo';
import authPlugin from './plugins/auth';
import { registerMenuItemRoutes } from './routes/menu-items';
import { registerRestaurantRoutes } from './routes/restaurants';

export const buildServer = async () => {
  const app = Fastify({ logger: true });

  await app.register(sensible);
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'catalog-service',
    dbConnected: isDatabaseConnected(),
    uptime: process.uptime(),
  }));

  await app.register(authPlugin);

  await app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', protectedApp.authenticate);
    await protectedApp.register(registerRestaurantRoutes, { prefix: '/restaurants' });
    await protectedApp.register(registerMenuItemRoutes, { prefix: '/menu-items' });
  });

  app.addHook('onClose', async () => {
    await disconnectFromDatabase();
  });

  return app;
};

const start = async () => {
  const app = await buildServer();

  await connectToDatabase(app.log);

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Catalog service listening on ${env.PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}
