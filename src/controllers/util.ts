import type { ElectionStatus } from '../schemas/elections.js';
import type { ControllerError, ControllerResult } from './types.js';

export function ev<T extends any>(
  data: T | null,
  error: Omit<ControllerError, 'success'> | null = null
): ControllerResult<T> {
  if (data !== null && error === null) {
    return [data, null];
  }
  if (data === null && error !== null) {
    return [null, { ...error, success: false }];
  }
  return [
    null,
    {
      status: 500,
      success: false,
      message: 'Unexpected state: both data and error are provided.',
    },
  ];
}

export function getElectionStatus<T extends { startDate: Date; endDate: Date }>(
  args: T
): ElectionStatus {
  const now = Date.now();
  if (args.startDate.getTime() >= now) return 'inactive';
  if (args.endDate.getTime() <= now) return 'ended';
  return 'active';
}
