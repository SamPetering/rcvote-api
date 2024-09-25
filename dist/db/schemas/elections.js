import { serial, integer, pgTable, timestamp, varchar, } from 'drizzle-orm/pg-core';
import { Users } from './users.js';
import { relations } from 'drizzle-orm';
import { createSelectSchema } from 'drizzle-zod';
export const Elections = pgTable('elections', {
    id: varchar('id', { length: 7 }).primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    creatorId: integer('creator_id')
        .notNull()
        .references(() => Users.id),
});
export const ElectionsRelations = relations(Elections, ({ one, many }) => ({
    creator: one(Users, {
        fields: [Elections.creatorId],
        references: [Users.id],
    }),
    config: one(ElectionConfigs, {
        fields: [Elections.id],
        references: [ElectionConfigs.electionId],
    }),
    candidates: many(ElectionCandidates),
    votes: many(Votes),
}));
export const ElectionConfigs = pgTable('election_configs', {
    id: serial('id').primaryKey(),
    electionId: varchar('election_id', { length: 7 }).references(() => Elections.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    name: varchar('name', { length: 64 }).notNull(),
    description: varchar('description', { length: 1024 }),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
});
export const ElectionCandidates = pgTable('election_candidates', {
    id: serial('id').primaryKey(),
    electionId: varchar('election_id', { length: 7 }).references(() => Elections.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
    name: varchar('name', { length: 64 }).notNull(),
    color: varchar('color', { length: 7 }).notNull(),
    description: varchar('description', { length: 256 }),
});
export const ElectionCandidatesRelations = relations(ElectionCandidates, ({ one }) => ({
    election: one(Elections, {
        fields: [ElectionCandidates.electionId],
        references: [Elections.id],
    }),
}));
export const Votes = pgTable('votes', {
    id: serial('id').primaryKey(),
    electionHash: varchar('election_id', { length: 7 }).references(() => Elections.id, { onDelete: 'cascade' }),
    voterId: integer('voter_id')
        .notNull()
        .references(() => Users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
export const VotesRelations = relations(Votes, ({ one, many }) => ({
    rankings: many(Rankings),
    voter: one(Users, {
        fields: [Votes.voterId],
        references: [Users.id],
    }),
    election: one(Elections, {
        fields: [Votes.electionHash],
        references: [Elections.id],
    }),
}));
export const Rankings = pgTable('rankings', {
    id: serial('id').primaryKey(),
    voteId: integer('vote_id')
        .notNull()
        .references(() => Votes.id, { onDelete: 'cascade' }),
    candidateId: integer('candidate_id')
        .notNull()
        .references(() => ElectionCandidates.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});
export const RankingsRelations = relations(Rankings, ({ one }) => ({
    vote: one(Votes, {
        fields: [Rankings.voteId],
        references: [Votes.id],
    }),
}));
export const selectElectionSchema = createSelectSchema(Elections);
export const selectElectionConfigSchema = createSelectSchema(ElectionConfigs);
export const selectElectionCandidateSchema = createSelectSchema(ElectionCandidates);
export const selectElectionInfo = selectElectionSchema.extend({
    config: selectElectionConfigSchema,
    candidates: selectElectionCandidateSchema,
});
//# sourceMappingURL=elections.js.map