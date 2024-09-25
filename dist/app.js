import * as path from 'path';
import AutoLoad, {} from '@fastify/autoload';
import {} from 'fastify';
import { fileURLToPath } from 'url';
import { serializerCompiler, validatorCompiler, } from 'fastify-type-provider-zod';
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
const options = {};
const app = async (fastify, opts) => {
    const shutdown = async () => {
        try {
            await fastify.close();
            console.log('Server shut down gracefully');
            process.exit(0);
        }
        catch (err) {
            console.error('Error during shutdown:', err);
            process.exit(1);
        }
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    fastify.setValidatorCompiler(validatorCompiler);
    fastify.setSerializerCompiler(serializerCompiler);
    void fastify.register(AutoLoad, {
        dir: path.join(__dirname, '_plugins'),
        options: opts,
        forceESM: true,
        maxDepth: 8,
    });
    void fastify.register(AutoLoad, {
        dir: path.join(__dirname, 'plugins'),
        options: opts,
        forceESM: true,
        maxDepth: 8,
    });
    void fastify.register(AutoLoad, {
        dir: path.join(__dirname, 'routes'),
        options: opts,
        forceESM: true,
        maxDepth: 8,
    });
};
export default app;
export { app, options };
//# sourceMappingURL=app.js.map