import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { CONNECTION_CFG } from './config.js';
const sql = postgres({
    ...CONNECTION_CFG,
    max: 1,
});
const db = drizzle(sql);
await migrate(db, { migrationsFolder: 'drizzle' });
await sql.end();
//# sourceMappingURL=migrate.js.map