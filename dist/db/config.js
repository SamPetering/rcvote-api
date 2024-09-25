import dotenv from 'dotenv';
import { requireVariable } from '../util.js';
dotenv.config({ path: '.env.local' });
export const CONNECTION_CFG = {
    host: requireVariable('DB_HOST'),
    user: requireVariable('DB_USER'),
    password: requireVariable('DB_PASSWORD'),
    database: requireVariable('DB_NAME'),
    port: 5432,
};
//# sourceMappingURL=config.js.map