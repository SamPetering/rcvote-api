import { defineConfig } from 'drizzle-kit';
import { requireVariable } from './src/util';

export default defineConfig({
  schema: 'dist/db/schemas/*.js',
  out: 'drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'localhost',
    port: Number(requireVariable('POSTGRES_PORT')),
    user: requireVariable('POSTGRES_USER'),
    password: requireVariable('POSTGRES_PASSWORD'),
    database: requireVariable('POSTGRES_DB'),
    ssl: false,
  },
  verbose: true,
  strict: true,
});
