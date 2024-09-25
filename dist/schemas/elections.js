import { z } from 'zod';
export const electionHashSchema = z.string().length(7);
export const voterIdSchema = z.number();
const ELECTION_NAME_MAX_LENGTH = 2 ** 6;
const ELECTION_DESCRIPTION_MAX_LENGTH = 2 ** 10;
const CANDIDATES_MAX_LENGTH = 2 ** 5;
const CANDIDATES_MIN_LENGTH = 2;
const CANDIDATE_NAME_MAX_LENGTH = 2 ** 6;
const CANDIDATE_DESCRIPTION_MAX_LENGTH = 2 ** 8;
export const electionConfigPayloadSchema = z.object({
    electionConfig: z.object({
        name: z.string().min(3).max(ELECTION_NAME_MAX_LENGTH),
        description: z.string().max(ELECTION_DESCRIPTION_MAX_LENGTH).optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        candidates: z
            .array(z.object({
            name: z.string().min(1).max(CANDIDATE_NAME_MAX_LENGTH),
            color: z.string().max(7),
            description: z
                .string()
                .max(CANDIDATE_DESCRIPTION_MAX_LENGTH)
                .optional(),
        }))
            .min(CANDIDATES_MIN_LENGTH)
            .max(CANDIDATES_MAX_LENGTH),
    }),
});
export const callElectionDataSchema = electionConfigPayloadSchema.shape.electionConfig.extend({
    electionId: electionHashSchema,
    creatorId: z.number(),
});
export const ballotResponseSchema = z.object({
    success: z.boolean(),
    ballot: z.object({
        electionInfo: z.object({
            name: z.string(),
            description: z.string().nullable(),
            endDate: z.coerce.date().nullable(),
        }),
        candidates: z.array(z.object({
            id: z.number(),
            name: z.string(),
            color: z.string(),
            description: z.string().nullable(),
        })),
    }),
});
export const voteDataSchema = z.object({
    electionId: electionHashSchema,
    voterId: voterIdSchema,
    rankings: z.array(z.object({
        candidateId: z.number(),
        rank: z.number(),
    })),
});
export const electionStatusSchema = z.union([
    z.literal('inactive'),
    z.literal('active'),
    z.literal('ended'),
]);
export const electionInfoResponseSchema = z.object({
    success: z.boolean(),
    electionInfo: z.object({
        name: z.string(),
        status: electionStatusSchema,
        candidates: z.array(z.object({
            name: z.string(),
            description: z.string().nullable(),
            color: z.string(),
        })),
    }),
});
export const voteCountResponseSchema = z.object({
    success: z.boolean(),
    voteCount: z.number(),
});
//# sourceMappingURL=elections.js.map