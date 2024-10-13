import { defineConfig } from 'drizzle-kit';
import { requireVariable } from './src/util';

export default defineConfig({
  schema: 'dist/db/schemas/*.js',
  out: 'drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // using SERVER_HOST instead of DB_HOST to connect to the docker container
    host: requireVariable('SERVER_HOST'),
    user: requireVariable('POSTGRES_USER'),
    password: requireVariable('POSTGRES_PASSWORD'),
    database: requireVariable('POSTGRES_DB'),
    ssl: false,
  },
  verbose: true,
  strict: true,
});
