import * as path from 'path';
import AutoLoad, { type AutoloadPluginOptions } from '@fastify/autoload';
import { type FastifyPluginAsync } from 'fastify';
import { fileURLToPath } from 'url';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!

  // Use Zod to compile request and response validation schemas.
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  // Do not touch the following lines
  // This loads all plugins defined in _plugins
  // those should be "root" level plugins that are loaded before those defined in 'plugins'
  // this allows plugins defined in 'plugins' to use decorators defined in '_plugins'
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, '_plugins'),
    options: opts,
    forceESM: true,
    maxDepth: 8,
  });

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
    maxDepth: 8,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true,
    maxDepth: 8,
  });
};

export default app;
export { app, options };
