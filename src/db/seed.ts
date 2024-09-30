import { db } from '../db/dbClient.js';
import { ROLES, ROLE_DESCRIPTIONS } from '../constants.js';
import { sql } from 'drizzle-orm';
import { Roles } from './schemas/users.js';

async function roleExists(roleName: string) {
  const result = await db
    .select({ exists: sql<number>`COUNT(*)` })
    .from(Roles)
    .where(sql`name = ${roleName}`);
  return !!result?.[0] && result[0].exists > 0;
}

async function insertRole(role: keyof typeof ROLES) {
  await db
    .insert(Roles)
    .values({ name: ROLES[role], description: ROLE_DESCRIPTIONS[role] })
    .execute();
}

async function seed() {
  const roleKeys = Object.keys(ROLES) as (keyof typeof ROLES)[];
  for (const k of roleKeys) {
    const exists = await roleExists(ROLES[k]);
    if (!exists) {
      await insertRole(k);
    } 
  }
}

await seed();
