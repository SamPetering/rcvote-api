import fp from 'fastify-plugin';
export default fp(async (fastify, opts) => {
    fastify.decorate('someSupport', function () {
        return 'hugs';
    });
});
//# sourceMappingURL=support.js.map