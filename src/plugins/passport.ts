import * as path from 'path';
import fp from 'fastify-plugin';
import fastifySecureSession from '@fastify/secure-session';
import fastifyPassport from '@fastify/passport';
import fs from 'fs';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { __dirname } from '../app.js';
import { z } from 'zod';
import { findOrCreateUser } from '../controllers/users.js';
import { requireVariable } from '../util.js';
import { userTokenPayloadSchema } from '../schemas/users.js';

const googleProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  emails: z
    .array(
      z.object({
        value: z.string().email(),
        verified: z.boolean(),
      })
    )
    .min(1),
});

export default fp(async (fastify) => {
  const secretKeyPath = path.resolve(__dirname, '../secret-key');
  fastify.register(fastifySecureSession, {
    key: fs.readFileSync(secretKeyPath),
    cookie: {
      path: '/',
    },
  });
  fastify.register(fastifyPassport.default.initialize());
  fastify.register(fastifyPassport.default.secureSession());

  fastifyPassport.default.use(
    'google',
    new GoogleStrategy(
      {
        clientID: requireVariable('GOOGLE_OAUTH_CLIENT_ID'),
        clientSecret: requireVariable('GOOGLE_OAUTH_CLIENT_SECRET'),
        callbackURL: `http://localhost:${requireVariable('SERVER_PORT')}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profileResp, cb) => {
        try {
          const profile = googleProfileSchema.parse(profileResp);
          const [user, error] = await findOrCreateUser({
            email: profile.emails[0]!.value,
            displayName: profile.displayName,
            googleId: profile.id,
          });
          if (error != null) {
            console.error('User not found or created');
            return cb(new Error('User not found or created'), false);
          }
          cb(null, user);
        } catch (e) {
          console.error('Error processing OAuth response:', e);
          return cb(e, false);
        }
      }
    )
  );

  fastifyPassport.default.registerUserSerializer(async (user, request) => {
    return user;
  });

  fastifyPassport.default.registerUserDeserializer(async (user, request) => {
    return user;
  });

  fastify.get(
    '/api/auth/google/callback',
    {
      preValidation: fastifyPassport.default.authenticate('google', {
        scope: ['profile', 'email'],
      }),
    },
    async (request, reply) => {
      const tokens = await fastify.getTokens(
        userTokenPayloadSchema.parse(request.user)
      );
      reply.setTokens(tokens).redirect('http://localhost:5173/home');
    }
  );

  fastify.get(
    '/api/login',
    fastifyPassport.default.authenticate('google', {
      scope: ['profile', 'email'],
    })
  );

  fastify.get('/api/logout', async (request, reply) => {
    // TODO: increment access token version in db
    await request.logout();
    reply.send({ success: true });
  });
});

declare module 'fastify' {
  export interface PassportUser {
    id: number;
    email: string;
    displayName: string;
    refreshTokenVersion: number;
    roles: string[];
  }
}
