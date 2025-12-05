import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import env from '../config/env';

export interface AuthenticatedUser extends JwtPayload {
  sub: string;
  email?: string;
  scope?: string | string[];
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: AuthenticatedUser | null;
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  // This line adds a 'user' property to the Fastify request object, initializing it to null.
  // It allows middleware and route handlers to store authenticated user information on requests.
  app.decorateRequest('user', null);

  const authenticate = async (request: FastifyRequest, _reply: FastifyReply) => {
    if (request.method === 'OPTIONS') {
      return;
    }

    if (env.AUTH_DISABLED) {
      request.user = {
        sub: 'dev-user',
        email: 'dev@example.com',
        scope: 'catalog:admin',
      };
      return;
    }

    const authHeader = request.headers.authorization ?? '';

    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      throw app.httpErrors.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      throw app.httpErrors.unauthorized('Missing bearer token');
    }

    try {
      const payload = jwt.verify(token, env.AUTH_JWT_SECRET, {
        issuer: env.AUTH_JWT_ISSUER,
        audience: env.AUTH_JWT_AUDIENCE,
      });

      if (!payload || typeof payload === 'string') {
        throw app.httpErrors.unauthorized('Invalid token payload');
      }

      request.user = payload as AuthenticatedUser;
    } catch (error) {
      request.log.warn({ err: error }, 'JWT verification failed');
      throw app.httpErrors.unauthorized('Invalid or expired token');
    }
  };

  // The following line adds the 'authenticate' function as a decorator on the Fastify instance.
  // By doing this, any part of the app (such as routes or hooks) can use 'app.authenticate'
  // to require authentication logic, promoting reuse and consistency for protected endpoints.
  app.decorate('authenticate', authenticate);
};

export default fp(authPlugin);

