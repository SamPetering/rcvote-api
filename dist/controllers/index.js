import {} from 'fastify';
export function handleError(reply, error) {
    const { status, message, success } = error;
    reply.status(status).send({
        success,
        message,
    });
}
//# sourceMappingURL=index.js.map