import { db } from '../db/dbClient.js';
import { ROLES, ROLE_DESCRIPTIONS } from '../constants.js';
import { inArray, sql } from 'drizzle-orm';
import {
  Roles,
  Users,
  type InsertUserData,
  type SelectUserData,
} from './schemas/users.js';
import {
  ElectionCandidates,
  ElectionConfigs,
  Elections,
  Rankings,
  Votes,
  type InsertElectionCandidateData,
  type InsertElectionConfigData,
  type InsertElectionData,
  type InsertRankingData,
  type InsertVoteData,
} from './schemas/elections.js';
import { faker } from '@faker-js/faker';
import range from 'lodash/range.js';
import shuffle from 'lodash/shuffle.js';
import groupBy from 'lodash/groupBy.js';
import { getEnvironment } from '../util.js';

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

async function userExists(email: string) {
  const result = await db
    .select({ exists: sql<number>`COUNT(*)` })
    .from(Users)
    .where(sql`email = ${email}`);
  return !!result?.[0] && result[0].exists > 0;
}

async function cleanElections(electionIds: string[]) {
  await db.delete(Elections).where(inArray(Elections.id, electionIds));
}

const COLORS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];

async function seedDevData({
  numberOfElections = 6,
  numberOfCandidates = 3,
}: {
  numberOfElections: number;
  numberOfCandidates: number;
}) {
  if (getEnvironment() !== 'dev')
    throw new Error('cannot seed dev data in QA or Prod');

  // 2. Add dummy users (how else will you get them?)
  const dummyUsers: InsertUserData[] = [
    {
      email: 'user1@example.com',
      displayName: 'User One',
      googleId: 'google-id-1',
    },
    {
      email: 'user2@example.com',
      displayName: 'User Two',
      googleId: 'google-id-2',
    },
    {
      email: 'user3@example.com',
      displayName: 'User Three',
      googleId: 'google-id-3',
    },
    {
      email: 'user4@example.com',
      displayName: 'User Four',
      googleId: 'google-id-4',
    },
    {
      email: 'user5@example.com',
      displayName: 'User Five',
      googleId: 'google-id-5',
    },
    {
      email: 'user6@example.com',
      displayName: 'User Six',
      googleId: 'google-id-6',
    },
    {
      email: 'user7@example.com',
      displayName: 'User Seven',
      googleId: 'google-id-7',
    },
    {
      email: 'user8@example.com',
      displayName: 'User Eight',
      googleId: 'google-id-8',
    },
    {
      email: 'user9@example.com',
      displayName: 'User Nine',
      googleId: 'google-id-9',
    },
    {
      email: 'user10@example.com',
      displayName: 'User Ten',
      googleId: 'google-id-10',
    },
  ];

  for (const user of dummyUsers) {
    const exists = await userExists(user.email);
    if (!exists) {
      await db.insert(Users).values(user);
    }
  }

  const users = await db
    .select()
    .from(Users)
    .where(
      inArray(
        Users.email,
        dummyUsers.map((du) => du.email)
      )
    );

  if (users.length !== dummyUsers.length)
    throw new Error('Seed error: Dummy users not found after insert');

  // 3. create elections and configs
  const insertElections: InsertElectionData[] = range(0, numberOfElections).map(
    (i) => ({
      creatorId: 1,
      id: `elect0${i + 1}`.slice(-7),
    })
  );
  const insertElectionConfigs: InsertElectionConfigData[] = insertElections.map(
    (e, i) => {
      const status =
        i % 3 === 0 ? 'active' : i % 2 === 0 ? 'inactive' : 'ended';

      const startDate =
        status === 'inactive'
          ? faker.date.future({ years: 1 })
          : status === 'active'
            ? faker.date.past({ years: 1 })
            : faker.date.past({ years: 1 });

      const endDate =
        status === 'inactive'
          ? faker.date.future({ years: 1 })
          : status === 'active'
            ? faker.date.future({ years: 1 })
            : new Date();

      console.log({
        status,
        start: startDate.toLocaleString(),
        end: endDate.toLocaleString(),
      });

      return {
        electionId: e.id,
        name: `Test Election ${i + 1}`,
        startDate,
        endDate,
        description: faker.lorem.lines({ min: 1, max: 10 }).slice(0, 1024),
      };
    }
  );

  // 3.5 remove existing election data
  await cleanElections(insertElections.map((e) => e.id));

  // 4. insert elections and configs
  await db.insert(Elections).values(insertElections).returning();
  await db.insert(ElectionConfigs).values(insertElectionConfigs);
  const elections = await db
    .select()
    .from(Elections)
    .where(
      inArray(
        Elections.id,
        insertElections.map((ie) => ie.id)
      )
    );

  // 5. create election candidates
  const insertElectionCandidates: InsertElectionCandidateData[] = [];
  for (const e of elections) {
    const candidates: InsertElectionCandidateData[] = range(
      0,
      numberOfCandidates
    ).map((i) => ({
      electionId: e.id,
      color: COLORS[i & COLORS.length]!,
      name: faker.food.dish().slice(0, 64),
      description:
        i + 1 > numberOfCandidates / 2
          ? faker.lorem.sentences().slice(0, 256)
          : undefined,
    }));

    insertElectionCandidates.push(...candidates);
  }

  if (insertElectionCandidates.length) {
    await db.insert(ElectionCandidates).values(insertElectionCandidates);
  }
  const selectCandidates = await db
    .select()
    .from(ElectionCandidates)
    .where(
      inArray(
        ElectionCandidates.electionId,
        elections.map((e) => e.id)
      )
    );
  const electionCandidates = groupBy(selectCandidates, 'electionId');

  // 6. create votes (elections have many votes, users have one vote per election)
  // 6a. create election voters map
  const electionVoters: Record<string, SelectUserData[]> = {};
  for (const e of elections) {
    electionVoters[e.id] = users;
  }
  // 6b. create election votes from map
  const insertVotes: InsertVoteData[] = [];
  for (const e of elections) {
    const votes: InsertVoteData[] = electionVoters[e.id]!.map((voter) => ({
      voterId: voter.id,
      electionHash: e.id,
    }));
    insertVotes.push(...votes);
  }
  const selectVotes = await db.insert(Votes).values(insertVotes).returning();
  const electionVotes = groupBy(selectVotes, 'electionHash');

  // 7. create rankings (each vote has many rankings, each ranking has one canidate and one elecction)
  const insertRankings: InsertRankingData[] = [];
  for (const e of elections) {
    const voters = electionVoters[e.id]!;
    const candidates = electionCandidates[e.id]!;
    const votes = electionVotes[e.id]!;
    const rankings: InsertRankingData[] = voters.flatMap((voter) => {
      const vote = votes.find((v) => v.voterId === voter.id);
      if (!vote) throw new Error('Vote not found');
      const voterRankings: InsertRankingData[] = shuffle(candidates).map(
        (c, i) => ({
          candidateId: c.id,
          rank: i,
          voteId: vote.id,
        })
      );
      return voterRankings;
    });
    insertRankings.push(...rankings);
  }
  await db.insert(Rankings).values(insertRankings);
}

async function seed() {
  // 1. add user roles
  const roleKeys = Object.keys(ROLES) as (keyof typeof ROLES)[];
  for (const k of roleKeys) {
    const exists = await roleExists(ROLES[k]);
    if (!exists) {
      await insertRole(k);
    }
  }

  if (getEnvironment() === 'dev') {
    await seedDevData({
      numberOfElections: 6,
      numberOfCandidates: 3,
    });
  }

  process.exit(0);
}

await seed();
