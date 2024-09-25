import { defineConfig } from 'drizzle-kit';
import { requireVariable } from './src/util';

export default defineConfig({
  schema: 'dist/db/schemas/*.js',
  out: 'drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: requireVariable('DB_HOST'),
    user: requireVariable('DB_USER'),
    password: requireVariable('DB_PASSWORD'),
    database: requireVariable('DB_NAME'),
    ssl: false,
  },
  verbose: true,
  strict: true,
});
