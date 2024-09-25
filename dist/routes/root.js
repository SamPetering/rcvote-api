const root = async (fastify, opts) => {
    fastify.get('/', async function (request, reply) {
        return 'rcvote-api';
    });
};
export default root;
//# sourceMappingURL=root.js.map