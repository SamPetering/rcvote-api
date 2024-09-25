import { type FastifyReply } from 'fastify';
import type { ControllerError } from './types.js';

export function handleError(reply: FastifyReply, error: ControllerError): void {
  const { status, message, success } = error;
  reply.status(status).send({
    success,
    message,
  });
}
