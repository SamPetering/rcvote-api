import { eq } from 'drizzle-orm';
import { db } from '../db/dbClient.js';
import { Votes } from '../db/schemas/elections.js';
import type { ElectionHash } from '../schemas/elections.js';
import { z } from 'zod';

type RCVStrategy = 'IRV' | 'STV';

const votesSchema = z.array(
  z.object({
    id: z.number(),
    rankings: z.array(
      z.object({
        candidateId: z.number(),
        rank: z.number(),
      })
    ),
  })
);
type Votes = z.infer<typeof votesSchema>;

export class ElectionsService {
  strategy: RCVStrategy;
  electionHash: ElectionHash;

  constructor(strategy: RCVStrategy, electionHash: ElectionHash) {
    if (strategy === 'STV') throw new Error('STV not implemented');
    this.strategy = strategy;
    this.electionHash = electionHash;
  }

  async getVotes() {
    const votes = await db.query.Votes.findMany({
      with: {
        rankings: true,
      },
      where: eq(Votes.electionHash, this.electionHash),
    });
    return votesSchema.parse(votes);
  }

  getFirstRankCandidate(vote: Votes[number]) {
    const first = vote.rankings.sort((a, b) => a.rank - b.rank)[0];
    if (first == null)
      throw new Error(`No first rank found for vote: ${vote.id}`);
    return first.candidateId;
  }

  getFirstRankCounts(votes: Votes) {
    const firstRankCounts: Record<number, number> = {};
    for (const vote of votes) {
      const firstRankCandidateId = this.getFirstRankCandidate(vote);
      if (firstRankCounts[firstRankCandidateId] == null) {
        firstRankCounts[firstRankCandidateId] = 1;
      } else {
        firstRankCounts[firstRankCandidateId]++;
      }
    }
    return firstRankCounts;
  }

  getCandidatesWithMaxCount(firstRankCounts: Record<number, number>) {
    const maxCount = Math.max(...Object.values(firstRankCounts));

    return Object.keys(firstRankCounts)
      .map(Number)
      .filter((cid) => firstRankCounts[cid] === maxCount);
  }

  calculateResults(votes: Votes): ElectionRoundResult {
    const voteCount = votes.length;
    const requiredCount = Math.floor(voteCount / 2) + 1;
    const firstRankCounts = this.getFirstRankCounts(votes);
    const candidatesWithMaxCount =
      this.getCandidatesWithMaxCount(firstRankCounts);
    const tie = candidatesWithMaxCount.length > 1;

    if (tie) {
      return {
        tie,
        firstRankCounts,
        candidatesWithMaxCount,
      };
    }

    const winner = Object.keys(firstRankCounts)
      .map(Number)
      .find((cid) => firstRankCounts[cid]! >= requiredCount);

    return {
      winner,
      firstRankCounts,
    };
  }

  getLosers(firstRankCounts: Record<number, number>) {
    const minCount = Math.min(...Object.values(firstRankCounts));
    return Object.keys(firstRankCounts)
      .map(Number)
      .filter((cid) => firstRankCounts[cid] === minCount);
  }

  redistributeVotes(votes: Votes, losers: number[]) {
    return votes.map((vote) => ({
      ...vote,
      rankings: vote.rankings.filter((r) => !losers.includes(r.candidateId)),
    }));
  }

  runElectionRounds(
    votes: Votes,
    electionResult: ElectionResult,
    round: number
  ): ElectionResult {
    const res = this.calculateResults(votes);
    // store round result
    electionResult[round] = res;

    // TIE
    if ('tie' in res && res.tie) {
      return electionResult;
    }

    // NO WINNER, REDISTRIBUTE AND RE-RUN
    if ('winner' in res && res.winner == null) {
      const losers = this.getLosers(res.firstRankCounts);
      const newVotes = this.redistributeVotes(votes, losers);
      return this.runElectionRounds(newVotes, electionResult, round + 1);
    }

    // IF NO OTHER CONDITIONS ARE MET, WE HAVE A WINNER
    return electionResult;
  }

  async getResults() {
    const votes = await this.getVotes();
    const res = this.runElectionRounds(votes, {}, 1);
    return res;
  }
}

type ElectionRoundWinnerResult = {
  firstRankCounts: Record<number, number>;
  winner: number | undefined;
};
type ElectionRoundTieResult = {
  firstRankCounts: Record<number, number>;
  tie: boolean;
  candidatesWithMaxCount: Record<number, number>;
};
type ElectionRoundResult = ElectionRoundWinnerResult | ElectionRoundTieResult;
type ElectionResult = Record<number, ElectionRoundResult>;
