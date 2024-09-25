import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  createUser,
  findUser,
  getUserCreatedElections,
  incrementRefreshTokenVersion,
  makeUserAdmin,
} from '../../controllers/users.js';
import { handleError } from '../../controllers/index.js';
import { idResponseSchema } from '../../schemas/shared.js';
import { insertUserSchema } from '../../db/schemas/users.js';
import {
  userTokenPayloadSchema,
  userResponseSchema,
} from '../../schemas/users.js';
import { z } from 'zod';

const users: FastifyPluginAsyncZod = async (fastify, opts): Promise<void> => {
  fastify.route({
    method: 'PUT',
    url: '/users/create',
    schema: {
      body: insertUserSchema,
      response: {
        200: idResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const [user, error] = await createUser(request.body);
      if (error != null) {
        handleError(reply, error);
        return;
      }
      reply.send({
        success: true,
        id: user.id,
      });
    },
  });

  fastify.route({
    method: 'GET',
    url: '/users/me',
    preHandler: [fastify.decodeUser],
    handler: async (request, reply) => {
      if (!request.hasToken()) {
        // no token
        // reply.status(400).send({ error: 'Token not provided' });
        reply.status(200).send(null);
        return;
      }

      if (!request.user) {
        // token didn't decode, send unauthorized response so the client can try to refresh
        reply.status(401).send({ error: 'Invalid token' });
        return;
      }

      const [user, error] = await findUser(
        userTokenPayloadSchema.parse(request.user).id
      );
      if (error) {
        handleError(reply, error);
        return;
      }
      reply.send(userResponseSchema.parse(user));
    },
  });

  fastify.route({
    method: 'GET',
    url: '/users/me/refresh',
    preHandler: [fastify.refreshAuthenticate],
    handler: async (request, reply) => {
      if (!request.hasToken()) {
        // no token
        reply.status(400).send({ error: 'Token not provided' });
        return;
      }

      const user = userTokenPayloadSchema.parse(request.user);
      const [tokenVersion, error] = await incrementRefreshTokenVersion(user.id);
      if (error) {
        handleError(reply, error);
        return;
      }
      user.refreshTokenVersion = tokenVersion;
      const tokens = await fastify.getTokens(user);
      reply.setTokens(tokens).send({ success: true });
    },
  });

  fastify.route({
    method: 'POST',
    url: '/users/me/logout',
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = userTokenPayloadSchema.parse(request.user);
      const [_, error] = await incrementRefreshTokenVersion(user.id);
      if (error != null) {
        handleError(reply, error);
        return;
      }

      request.logout();

      reply.clearTokens().send({ sucess: true });
    },
  });

  fastify.route<{ Params: { userId: string } }>({
    method: 'PUT',
    url: '/users/:userId/promote/admin',
    preHandler: [fastify.adminAuthenticate],
    handler: async (request, reply) => {
      const id = z.coerce.number().parse(request.params?.userId);
      const [_, error] = await makeUserAdmin(id);
      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({ success: true });
    },
  });

  fastify.route<{ Params: { userId: string } }>({
    method: 'GET',
    url: '/users/:userId/elections',
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const id = z.coerce.number().parse(request.params?.userId);
      const [elections, error] = await getUserCreatedElections(id);
      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        elections,
      });
    },
  });
};

export default users;
