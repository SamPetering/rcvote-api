import { eq } from 'drizzle-orm';
import { db } from '../db/dbClient.js';
import { Votes } from '../db/schemas/elections.js';
import { z } from 'zod';
const votesSchema = z.array(z.object({
    id: z.number(),
    rankings: z.array(z.object({
        candidateId: z.number(),
        rank: z.number(),
    })),
}));
export class ElectionsService {
    strategy;
    electionHash;
    constructor(strategy, electionHash) {
        if (strategy === 'STV')
            throw new Error('STV not implemented');
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
    getFirstRankCandidate(vote) {
        const first = vote.rankings.sort((a, b) => a.rank - b.rank)[0];
        if (first == null)
            throw new Error(`No first rank found for vote: ${vote.id}`);
        return first.candidateId;
    }
    getFirstRankCounts(votes) {
        const firstRankCounts = {};
        for (const vote of votes) {
            const firstRankCandidateId = this.getFirstRankCandidate(vote);
            if (firstRankCounts[firstRankCandidateId] == null) {
                firstRankCounts[firstRankCandidateId] = 1;
            }
            else {
                firstRankCounts[firstRankCandidateId]++;
            }
        }
        return firstRankCounts;
    }
    getCandidatesWithMaxCount(firstRankCounts) {
        const maxCount = Math.max(...Object.values(firstRankCounts));
        return Object.keys(firstRankCounts)
            .map(Number)
            .filter((cid) => firstRankCounts[cid] === maxCount);
    }
    calculateResults(votes) {
        const voteCount = votes.length;
        const requiredCount = Math.floor(voteCount / 2) + 1;
        const firstRankCounts = this.getFirstRankCounts(votes);
        const candidatesWithMaxCount = this.getCandidatesWithMaxCount(firstRankCounts);
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
            .find((cid) => firstRankCounts[cid] >= requiredCount);
        return {
            winner,
            firstRankCounts,
        };
    }
    getLosers(firstRankCounts) {
        const minCount = Math.min(...Object.values(firstRankCounts));
        return Object.keys(firstRankCounts)
            .map(Number)
            .filter((cid) => firstRankCounts[cid] === minCount);
    }
    redistributeVotes(votes, losers) {
        return votes.map((vote) => ({
            ...vote,
            rankings: vote.rankings.filter((r) => !losers.includes(r.candidateId)),
        }));
    }
    runElectionRounds(votes, electionResult, round) {
        const res = this.calculateResults(votes);
        electionResult[round] = res;
        if ('tie' in res && res.tie) {
            return electionResult;
        }
        if ('winner' in res && res.winner == null) {
            const losers = this.getLosers(res.firstRankCounts);
            const newVotes = this.redistributeVotes(votes, losers);
            return this.runElectionRounds(newVotes, electionResult, round + 1);
        }
        return electionResult;
    }
    async getResults() {
        const votes = await this.getVotes();
        const res = this.runElectionRounds(votes, {}, 1);
        return res;
    }
}
//# sourceMappingURL=elections.js.map