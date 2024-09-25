import { eq, and, count } from 'drizzle-orm';
import { db } from '../db/dbClient.js';
import { ElectionCandidates, ElectionConfigs, Elections, Rankings, Votes, } from '../db/schemas/elections.js';
import { generateElectionHash } from '../util.js';
import { ev, getElectionStatus } from './util.js';
export async function createElection(creatorId) {
    try {
        const [res] = await db
            .insert(Elections)
            .values({
            id: generateElectionHash(),
            creatorId,
        })
            .returning({ id: Elections.id });
        if (!res?.id)
            throw new Error();
        return ev(res.id);
    }
    catch (e) {
        return ev(null, {
            message: 'Failed to create election',
            status: 500,
        });
    }
}
export async function deleteElection(electionHash, creatorId) {
    try {
        const res = await db
            .delete(Elections)
            .where(and(eq(Elections.id, electionHash), eq(Elections.creatorId, creatorId)))
            .returning({ id: Elections.id });
        return ev(res.map((r) => r.id));
    }
    catch (e) {
        return ev(null, {
            message: 'Error deleting election',
            status: 500,
        });
    }
}
export async function callElection(electionConfig) {
    try {
        const { electionId, name, description, startDate, endDate, candidates, creatorId, } = electionConfig;
        await db.transaction(async (tx) => {
            await db.insert(Elections).values({
                id: electionId,
                creatorId,
            });
            await tx.insert(ElectionConfigs).values({
                electionId,
                name,
                description,
                startDate,
                endDate,
            });
            await tx.insert(ElectionCandidates).values(candidates.map((c) => ({
                electionId,
                name: c.name,
                color: c.color,
                description: c.description,
            })));
        });
        return ev(electionId);
    }
    catch (e) {
        return ev(null, {
            message: 'Failed to call election',
            status: 500,
        });
    }
}
export async function getBallot(electionId) {
    const [election] = await db
        .select()
        .from(Elections)
        .where(eq(Elections.id, electionId))
        .limit(1);
    const [electionConfig] = await db
        .select()
        .from(ElectionConfigs)
        .where(eq(ElectionConfigs.electionId, electionId))
        .limit(1);
    if (!election || !electionConfig) {
        return ev(null, {
            status: 404,
            message: 'Election not found',
        });
    }
    if (getElectionStatus(electionConfig) !== 'active') {
        return ev(null, {
            status: 400,
            message: 'Election not yet active',
        });
    }
    const candidates = (await db
        .select()
        .from(ElectionCandidates)
        .where(eq(ElectionCandidates.electionId, electionId))).map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        description: c.description,
    }));
    return ev({
        electionInfo: {
            name: electionConfig.name,
            description: electionConfig.description,
            endDate: electionConfig.endDate,
        },
        candidates,
    });
}
export async function vote(voteData) {
    try {
        const { electionId, voterId, rankings } = voteData;
        const [election] = await db
            .select()
            .from(Elections)
            .where(eq(Elections.id, electionId))
            .limit(1);
        const [electionConfig] = await db
            .select()
            .from(ElectionConfigs)
            .where(eq(ElectionConfigs.electionId, electionId))
            .limit(1);
        if (!election || !electionConfig) {
            return ev(null, {
                status: 404,
                message: 'Election not found',
            });
        }
        if (getElectionStatus(electionConfig) !== 'active') {
            return ev(null, {
                status: 400,
                message: 'Election not active',
            });
        }
        const voteId = await db.transaction(async (tx) => {
            const [voteResult] = await tx
                .insert(Votes)
                .values({
                electionHash: electionId,
                voterId,
            })
                .returning({ id: Votes.id });
            if (!voteResult)
                throw new Error();
            await tx
                .insert(Rankings)
                .values(rankings.map((r) => ({ ...r, voteId: voteResult.id })));
            return voteResult.id;
        });
        return ev(voteId);
    }
    catch (e) {
        return ev(null, {
            message: 'Error creating vote',
            status: 500,
        });
    }
}
export async function getHasVoted(electionHash, voterId) {
    try {
        const [vote] = await db
            .select()
            .from(Votes)
            .where(and(eq(Votes.electionHash, electionHash), eq(Votes.voterId, voterId)))
            .limit(1);
        return ev(!!vote);
    }
    catch (e) {
        return ev(null, {
            message: 'Error getting vote status',
            status: 500,
        });
    }
}
export async function activateElection(electionHash) {
    try {
        const [electionConfigRes] = await db
            .update(ElectionConfigs)
            .set({
            startDate: new Date(),
        })
            .where(eq(ElectionConfigs.electionId, electionHash))
            .returning({
            startDate: ElectionConfigs.startDate,
            endDate: ElectionConfigs.endDate,
        });
        if (!electionConfigRes)
            throw new Error();
        return ev(getElectionStatus(electionConfigRes) === 'active');
    }
    catch (e) {
        console.log('ERROR', e);
        return ev(null, {
            message: 'Error activating election',
            status: 500,
        });
    }
}
export async function getElectionInfo(electionHash) {
    try {
        const [election] = await db
            .select()
            .from(Elections)
            .where(eq(Elections.id, electionHash))
            .limit(1);
        const [electionConfig] = await db
            .select()
            .from(ElectionConfigs)
            .where(eq(ElectionConfigs.electionId, electionHash))
            .limit(1);
        const candidates = await db
            .select()
            .from(ElectionCandidates)
            .where(eq(ElectionCandidates.electionId, electionHash));
        if (!election || !electionConfig || !candidates)
            throw new Error();
        const info = {
            candidates: candidates.map((c) => ({
                name: c.name,
                description: c.description,
                color: c.color,
            })),
            name: electionConfig.name,
            status: getElectionStatus(electionConfig),
        };
        return ev(info);
    }
    catch {
        return ev(null, {
            message: 'Error getting election info',
            status: 500,
        });
    }
}
export async function getVoteCount(electionHash) {
    try {
        const [votes] = await db
            .select({ count: count() })
            .from(Votes)
            .where(eq(Votes.electionHash, electionHash));
        if (votes == null)
            throw new Error();
        return ev(votes.count);
    }
    catch (e) {
        return ev(null, {
            message: 'Error getting vote count',
            status: 500,
        });
    }
}
//# sourceMappingURL=elections.js.map