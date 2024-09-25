import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { getEnvironment, requireVariable } from '../util.js';
import { userTokenPayloadSchema, } from '../schemas/users.js';
import fastifyCookie from '@fastify/cookie';
import { findUser } from '../controllers/users.js';
import { handleError } from '../controllers/index.js';
import { ROLES } from '../constants.js';
export default fp(async (fastify) => {
    fastify.register(fastifyCookie.default);
    fastify.register(fastifyJwt.default, {
        secret: requireVariable('JWT_SECRET'),
        decoratorName: 'jwtUser',
        sign: {
            expiresIn: '1m',
        },
        cookie: {
            cookieName: 'accessToken',
            signed: false,
        },
    });
    fastify.decorate('decodeUser', async function (request, reply) {
        try {
            const decoded = await request.jwtVerify({ onlyCookie: true });
            request.user = userTokenPayloadSchema.parse(decoded);
        }
        catch (error) {
            request.user = undefined;
        }
    });
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            const decoded = await request.jwtVerify({ onlyCookie: true });
            request.user = userTokenPayloadSchema.parse(decoded);
        }
        catch (error) {
            reply.status(401).send({ error: 'Invalid token' });
        }
    });
    fastify.decorate('adminAuthenticate', async function (request, reply) {
        try {
            const decoded = await request.jwtVerify({ onlyCookie: true });
            const parsed = userTokenPayloadSchema.parse(decoded);
            if (!parsed.roles.includes(ROLES.ADMIN))
                throw new Error();
            request.user = parsed;
        }
        catch (error) {
            reply.status(401).send({ error: 'Invalid token' });
        }
    });
    fastify.decorate('refreshAuthenticate', async function (request, reply) {
        try {
            const refreshToken = request.cookies.refreshToken;
            if (!refreshToken) {
                return reply.status(400).send({ error: 'Refresh token missing' });
            }
            const decoded = fastify.jwt.verify(refreshToken);
            const userToken = userTokenPayloadSchema.parse(decoded);
            const [user, error] = await findUser(userToken.id);
            if (error) {
                handleError(reply, error);
                return;
            }
            if (user.refreshTokenVersion != userToken.refreshTokenVersion) {
                request.logout();
                reply
                    .status(400)
                    .clearTokens()
                    .send({ error: 'Expired refresh token' });
                return;
            }
            request.user = userToken;
        }
        catch (error) {
            reply.status(400).send({ error: 'Invalid refresh token' });
        }
    });
    fastify.decorate('getTokens', async function (payload) {
        try {
            const accessToken = fastify.jwt.sign(payload, { expiresIn: '1m' });
            const refreshToken = fastify.jwt.sign(payload, { expiresIn: '30d' });
            return {
                accessToken,
                refreshToken,
            };
        }
        catch (e) {
            throw new Error('Invalid user token');
        }
    });
    fastify.decorateRequest('hasToken', function () {
        const token = this.cookies['accessToken'] ?? this.cookies['refreshToken'];
        return !!token;
    });
    fastify.decorateReply('setTokens', function ({ accessToken, refreshToken }) {
        this.setCookie('accessToken', accessToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: getEnvironment() === 'prod',
            maxAge: 60 * 60 * 15,
        }).setCookie('refreshToken', refreshToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: getEnvironment() === 'prod',
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return this;
    });
    fastify.decorateReply('clearTokens', function () {
        this.clearCookie('accessToken', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: getEnvironment() === 'prod',
            maxAge: 60 * 60 * 15,
        }).clearCookie('refreshToken', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: getEnvironment() === 'prod',
            maxAge: 1000 * 60 * 60 * 24 * 30,
        });
        return this;
    });
});
//# sourceMappingURL=jwt.js.map