import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { CONNECTION_CFG } from './config.js';
import * as electionsSchema from './schemas/elections.js';
import * as usersSchema from './schemas/users.js';
const schema = {
    ...electionsSchema,
    ...usersSchema,
};
const pool = new pg.Pool({
    ...CONNECTION_CFG,
    max: 10,
});
export const db = drizzle(pool, { schema, logger: true });
//# sourceMappingURL=dbClient.js.map