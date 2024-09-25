const health = async (fastify, opts) => {
    fastify.get('/health', async function (request, reply) {
        return { status: 'ok' };
    });
};
export default health;
//# sourceMappingURL=health.js.map