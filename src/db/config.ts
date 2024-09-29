import { requireVariable } from '../util.js';

export const CONNECTION_CFG = {
  host: requireVariable('POSTGRES_HOST'),
  port: Number(requireVariable('POSTGRES_PORT')),
  user: requireVariable('POSTGRES_USER'),
  password: requireVariable('POSTGRES_PASSWORD'),
  database: requireVariable('POSTGRES_DB'),
};
