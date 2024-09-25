import omit from 'lodash/omit.js';
import { z } from 'zod';
import { getElectionStatus } from '../controllers/util.js';

export const userTokenPayloadSchema = z.object({
  id: z.number(),
  displayName: z.string(),
  email: z.string(),
  refreshTokenVersion: z.number(),
  roles: z.array(z.string()),
});
export type UserTokenPayload = z.infer<typeof userTokenPayloadSchema>;

export const userSchema = z.object({
  id: z.number(),
  displayName: z.string(),
  email: z.string(),
  refreshTokenVersion: z.number(),
  roles: z.array(z.string()),
});
export type User = z.infer<typeof userSchema>;

export const userResponseSchema = z.object({
  id: z.number(),
  displayName: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const userElectionsData = z
  .object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date().nullable(),
    config: z.object({
      name: z.string(),
      createdAt: z.date(),
      updatedAt: z.date().nullable(),
      description: z.string().nullable(),
      startDate: z.date(),
      endDate: z.date(),
    }),
    candidates: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
        color: z.string(),
      })
    ),
    votes: z.array(z.any()),
  })
  .transform((data) =>
    omit(
      {
        ...data,
        voteCount: data.votes.length,
        status: getElectionStatus(data.config),
      },
      'votes'
    )
  );
export const userElectionsResponseDataSchema = z.array(userElectionsData);
export type UserElectionsResponseData = z.infer<
  typeof userElectionsResponseDataSchema
>;
