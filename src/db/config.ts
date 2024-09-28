import { requireVariable } from '../util.js';

export const CONNECTION_CFG = {
  host: requireVariable('DB_HOST'),
  user: requireVariable('DB_USER'),
  password: requireVariable('DB_PASSWORD'),
  database: requireVariable('DB_NAME'),
  port: 5432,
};
