import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { CONNECTION_CFG } from './config.js';

const dbName = CONNECTION_CFG.database; // Use your database name from the connection config
const defaultSql = postgres({
  ...CONNECTION_CFG,
  database: 'postgres', // Connect to the default database
  max: 1,
});

// Function to create the database if it doesn't exist
async function createDatabaseIfNotExists(dbName: string) {
  try {
    await defaultSql`CREATE DATABASE ${defaultSql(dbName)}`; // This will throw if the database already exists
  } catch (error: any) {
    if ('code' in error && error.code !== '42P04') {
      // 42P04 is the PostgreSQL error code for "database already exists"
      throw error; // Rethrow if it's a different error
    }
  }
}

await createDatabaseIfNotExists(dbName);
await defaultSql.end();

const sql = postgres({
  ...CONNECTION_CFG,
  max: 1,
});
const db = drizzle(sql);
await migrate(db, { migrationsFolder: 'drizzle' });
await sql.end();
