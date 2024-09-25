import fp from 'fastify-plugin';
import cors, {} from '@fastify/cors';
export default fp(async (fastify) => {
    fastify.register(cors, {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    });
});
//# sourceMappingURL=cors.js.map