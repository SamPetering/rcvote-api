import {
  serial,
  integer,
  pgTable,
  timestamp,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { Users } from './users.js';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import type { z } from 'zod';

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
  electionId: varchar('election_id', { length: 7 }).references(
    () => Elections.id,
    { onDelete: 'cascade' }
  ),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),

  name: varchar('name', { length: 64 }).notNull(),
  description: varchar('description', { length: 1024 }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
});

export const ElectionCandidates = pgTable('election_candidates', {
  id: serial('id').primaryKey(),
  electionId: varchar('election_id', { length: 7 }).references(
    () => Elections.id,
    { onDelete: 'cascade' }
  ),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),

  name: varchar('name', { length: 64 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  description: varchar('description', { length: 256 }),
});
export const ElectionCandidatesRelations = relations(
  ElectionCandidates,
  ({ one }) => ({
    election: one(Elections, {
      fields: [ElectionCandidates.electionId],
      references: [Elections.id],
    }),
  })
);

export const Votes = pgTable(
  'votes',
  {
    id: serial('id').primaryKey(),
    electionHash: varchar('election_id', { length: 7 }).references(
      () => Elections.id,
      { onDelete: 'cascade' }
    ),
    voterId: integer('voter_id')
      .notNull()
      .references(() => Users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (votes) => ({
    uniqueVoterElection: uniqueIndex('unique_voter_election').on(
      votes.voterId,
      votes.electionHash
    ),
  })
);

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

export const Rankings = pgTable(
  'rankings',
  {
    id: serial('id').primaryKey(),
    voteId: integer('vote_id')
      .notNull()
      .references(() => Votes.id, { onDelete: 'cascade' }),
    candidateId: integer('candidate_id')
      .notNull()
      .references(() => ElectionCandidates.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(), // Rank starts from 1 for the highest preference
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  },
  (rankings) => ({
    uniqueVoteCandidate: uniqueIndex('unique_vote_candidate').on(
      rankings.voteId,
      rankings.candidateId
    ),
  })
);

export const RankingsRelations = relations(Rankings, ({ one }) => ({
  vote: one(Votes, {
    fields: [Rankings.voteId],
    references: [Votes.id],
  }),
}));

export const insertElectionSchema = createInsertSchema(Elections);
export type InsertElectionData = z.infer<typeof insertElectionSchema>;
export const selectElectionSchema = createSelectSchema(Elections);
export type SelectElection = z.infer<typeof selectElectionSchema>;

export const insertElectionConfigSchema = createInsertSchema(ElectionConfigs);
export type InsertElectionConfigData = z.infer<
  typeof insertElectionConfigSchema
>;
export const selectElectionConfigSchema = createSelectSchema(ElectionConfigs);
export type SelectElectionConfig = z.infer<typeof selectElectionConfigSchema>;

export const insertElectionCandidateSchema =
  createInsertSchema(ElectionCandidates);
export type InsertElectionCandidateData = z.infer<
  typeof insertElectionCandidateSchema
>;
export const selectElectionCandidateSchema =
  createSelectSchema(ElectionCandidates);
export type SelectElectionCandidate = z.infer<
  typeof selectElectionCandidateSchema
>;

export const selectElectionInfo = selectElectionSchema.extend({
  config: selectElectionConfigSchema,
  candidates: selectElectionCandidateSchema,
});
export type SelectElectionInfo = z.infer<typeof selectElectionInfo>;

export const insertVoteSchema = createInsertSchema(Votes);
export type InsertVoteData = z.infer<typeof insertVoteSchema>;
export const selectVoteSchema = createSelectSchema(Votes);
export type SelectVoteData = z.infer<typeof selectVoteSchema>;

export const insertRankingSchema = createInsertSchema(Rankings);
export type InsertRankingData = z.infer<typeof insertRankingSchema>;
