import { getEnvironment } from '../util.js';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  if (getEnvironment() === 'dev') {
    fastify.addHook('onReady', () => {
      console.log('Registered routes:');
      const routes = fastify.printRoutes();
      console.log(routes);
    });
  }
});
