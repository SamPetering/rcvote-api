import Fastify from 'fastify';
import app from './app.js';
import { options } from './app.js';
import dotenv from 'dotenv';
import { requireVariable } from './util.js';

dotenv.config();

async function startServer() {
  const fastify = Fastify({
    logger: true,
  });

  try {
    await fastify.register(app, options);
    const port = Number(requireVariable('PORT'));
    const host = requireVariable('HOST');
    await fastify.listen({ port, host });

    const shutdown = async () => {
      try {
        await fastify.close();
        console.log('Server shut down gracefully');
        process.exit(0);
      } catch (e) {
        console.error('Error during shutdown:', e);
        process.exit(1);
      }
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (e) {
    fastify.log.error(e);
    process.exit(1);
  }
}

startServer();
