import { z } from 'zod';

export const electionHashSchema = z.string().length(7);
export type ElectionHash = z.infer<typeof electionHashSchema>;
export const voterIdSchema = z.number();

const ELECTION_NAME_MAX_LENGTH = 2 ** 6; // 64
const ELECTION_DESCRIPTION_MAX_LENGTH = 2 ** 10; // 1028
const CANDIDATES_MAX_LENGTH = 2 ** 5; // 32
const CANDIDATES_MIN_LENGTH = 2; // 2
const CANDIDATE_NAME_MAX_LENGTH = 2 ** 6; // 64
const CANDIDATE_DESCRIPTION_MAX_LENGTH = 2 ** 8; // 256

export const electionConfigPayloadSchema = z.object({
  electionConfig: z.object({
    name: z.string().min(3).max(ELECTION_NAME_MAX_LENGTH),
    description: z.string().max(ELECTION_DESCRIPTION_MAX_LENGTH).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    candidates: z
      .array(
        z.object({
          name: z.string().min(1).max(CANDIDATE_NAME_MAX_LENGTH),
          color: z.string().max(7),
          description: z
            .string()
            .max(CANDIDATE_DESCRIPTION_MAX_LENGTH)
            .optional(),
        })
      )
      .min(CANDIDATES_MIN_LENGTH)
      .max(CANDIDATES_MAX_LENGTH),
  }),
});
export type ElectionConfigPayload = z.infer<typeof electionConfigPayloadSchema>;
export const callElectionDataSchema =
  electionConfigPayloadSchema.shape.electionConfig.extend({
    electionId: electionHashSchema,
    creatorId: z.number(),
  });
export type CallElectionData = z.infer<typeof callElectionDataSchema>;

export const ballotResponseSchema = z.object({
  success: z.boolean(),
  ballot: z.object({
    electionInfo: z.object({
      name: z.string(),
      description: z.string().nullable(),
      endDate: z.coerce.date().nullable(),
    }),
    candidates: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        color: z.string(),
        description: z.string().nullable(),
      })
    ),
  }),
});
export type Ballot = z.infer<typeof ballotResponseSchema.shape.ballot>;

export const voteDataSchema = z.object({
  electionId: electionHashSchema,
  voterId: voterIdSchema,
  rankings: z.array(
    z.object({
      candidateId: z.number(),
      rank: z.number(),
    })
  ),
});
export type VoteData = z.infer<typeof voteDataSchema>;

export const electionStatusSchema = z.union([
  z.literal('inactive'),
  z.literal('active'),
  z.literal('ended'),
]);
export type ElectionStatus = z.infer<typeof electionStatusSchema>;

export const electionInfoResponseSchema = z.object({
  success: z.boolean(),
  electionInfo: z.object({
    name: z.string(),
    status: electionStatusSchema,
    candidates: z.array(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        color: z.string(),
      })
    ),
  }),
});
export type ElectionInfo = z.infer<
  typeof electionInfoResponseSchema.shape.electionInfo
>;

export const voteCountResponseSchema = z.object({
  success: z.boolean(),
  voteCount: z.number(),
});
