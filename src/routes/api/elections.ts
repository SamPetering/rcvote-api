import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  boolResponseSchema,
  idResponseSchema,
  messageResponseSchema,
} from '../../schemas/shared.js';
import {
  ballotResponseSchema,
  electionConfigPayloadSchema,
  electionHashSchema,
  electionInfoResponseSchema,
  voteCountResponseSchema,
  voteDataSchema,
  voterIdSchema,
} from '../../schemas/elections.js';
import {
  activateElection,
  callElection,
  createElection,
  deleteElection,
  getBallot,
  getElectionInfo,
  getHasVoted,
  getVoteCount,
  listElections,
  vote,
} from '../../controllers/elections.js';
import { handleError } from '../../controllers/index.js';
import { ElectionsService } from '../../services/elections.js';
import { userTokenPayloadSchema } from '../../schemas/users.js';
import { generateElectionHash } from '../../util.js';

type ElectionHashRoute = {
  Params: { electionHash: string };
};
type ElectionVoterRoute = {
  Params: { electionHash: string; voterId: string };
};

const elections: FastifyPluginAsyncZod = async (
  fastify,
  opts
): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/elections',
    handler: async (request, reply) => {
      const [elections, error] = await listElections();
      if (error) {
        handleError(reply, error);
        return;
      }
      reply.send({
        success: true,
        elections,
      });
    },
  });
  fastify.route({
    method: 'PUT',
    url: '/elections',
    preHandler: [fastify.authenticate],
    schema: {
      response: {
        200: idResponseSchema,
        500: messageResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const user = userTokenPayloadSchema.parse(request.user);
      const [id, error] = await createElection(user.id);

      if (error) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        id,
      });
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/elections/call',
    schema: {
      body: electionConfigPayloadSchema,
      response: {
        200: idResponseSchema,
        500: messageResponseSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = userTokenPayloadSchema.parse(request.user);
      const [electionHash, error] = await callElection({
        ...request.body.electionConfig,
        electionId: generateElectionHash(),
        creatorId: user.id,
      });

      console.log('AND HERE', { electionHash, error });
      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        id: electionHash,
      });
    },
  });

  fastify.route<ElectionHashRoute>({
    method: 'GET',
    url: '/elections/:electionHash/ballot',
    schema: {
      response: {
        200: ballotResponseSchema,
        404: messageResponseSchema,
        400: messageResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const [ballot, error] = await getBallot(request.params.electionHash);

      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        ballot,
      });
    },
  });

  fastify.route({
    method: 'PUT',
    url: '/elections/:electionHash/votes',
    schema: {
      body: voteDataSchema,
      response: {
        200: idResponseSchema,
        500: messageResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const [voteId, error] = await vote(request.body);

      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({ success: true, id: voteId });
    },
  });

  fastify.route<ElectionVoterRoute>({
    method: 'GET',
    url: '/elections/:electionHash/:voterId/voted',
    schema: {
      response: {
        200: boolResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { electionHash, voterId } = request.params;
      const [value, error] = await getHasVoted(
        electionHash,
        voterIdSchema.parse(Number(voterId))
      );
      if (error != null) {
        handleError(reply, error);
        return;
      }
      reply.send({ success: true, value });
    },
  });

  fastify.route<ElectionHashRoute>({
    method: 'PUT',
    url: '/elections/:electionHash/activate',
    schema: {
      response: {
        200: boolResponseSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const [value, error] = await activateElection(
        request.params.electionHash
      );

      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        value,
      });
    },
  });

  fastify.route<ElectionHashRoute>({
    method: 'GET',
    url: '/elections/:electionHash/info',
    schema: {
      response: {
        200: electionInfoResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const [info, error] = await getElectionInfo(request.params.electionHash);

      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        electionInfo: info,
      });
    },
  });

  fastify.route<ElectionHashRoute>({
    method: 'GET',
    url: '/elections/:electionHash/votes/count',
    schema: {
      response: {
        200: voteCountResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const [voteCount, error] = await getVoteCount(
        request.params.electionHash
      );

      if (error != null) {
        handleError(reply, error);
        return;
      }

      reply.send({
        success: true,
        voteCount,
      });
    },
  });

  fastify.route<ElectionHashRoute>({
    method: 'GET',
    url: '/elections/:electionHash/result',
    handler: async (request, reply) => {
      const es = new ElectionsService('IRV', request.params.electionHash);
      const r = await es.getResults();

      reply.send(r);
    },
  });

  fastify.route<ElectionHashRoute>({
    method: 'DELETE',
    url: '/elections/:electionHash',
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      const user = userTokenPayloadSchema.parse(request.user);
      const electionHash = electionHashSchema.parse(
        request.params.electionHash
      );
      const [ids, error] = await deleteElection(electionHash, user.id);
      if (error != null) {
        handleError(reply, error);
        return;
      }
      reply.send({ success: true, ids });
    },
  });
};

export default elections;
