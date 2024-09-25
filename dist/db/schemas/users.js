import { relations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, serial, timestamp, varchar, } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { Elections, Votes } from './elections.js';
export const Users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    googleId: varchar('google_id', { length: 255 }).notNull().unique(),
    refreshTokenVersion: integer('refresh_token_version').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
export const UserRoles = pgTable('user_roles', {
    userId: integer('user_id')
        .notNull()
        .references(() => Users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
        .notNull()
        .references(() => Roles.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));
export const Roles = pgTable('roles', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: varchar('description', { length: 1024 }),
});
export const insertUserSchema = createInsertSchema(Users);
export const selectUserSchema = createSelectSchema(Users);
export const selectRolesSchema = createSelectSchema(Roles);
export const selectUserRolesSchema = createSelectSchema(UserRoles);
export const selectUserWithRolesSchema = selectUserSchema.extend({
    userRoles: z.array(selectUserRolesSchema.extend({
        role: selectRolesSchema,
    })),
});
export const UsersRelations = relations(Users, ({ many, one }) => ({
    votes: many(Votes),
    userRoles: many(UserRoles),
    electionsCreated: many(Elections),
}));
export const RolesRelations = relations(Roles, ({ many }) => ({
    roleUsers: many(UserRoles),
}));
export const UserRolesRelations = relations(UserRoles, ({ one }) => ({
    user: one(Users, {
        fields: [UserRoles.userId],
        references: [Users.id],
    }),
    role: one(Roles, {
        fields: [UserRoles.roleId],
        references: [Roles.id],
    }),
}));
//# sourceMappingURL=users.js.map