import { v4 } from 'uuid';
import * as crypto from 'crypto';

export function requireVariable(key: string) {
  const v = process.env[key];
  if (v == null) throw new Error(`Missing environment variable: ${key}`);
  return v as string;
}

export function getEnvironment() {
  return process.env.NODE_ENV === 'prod'
    ? 'prod'
    : process.env.NODE_ENV === 'test'
      ? 'test'
      : 'dev';
}

export function generateElectionHash() {
  return crypto
    .createHash('sha1')
    .update(v4() + Date.now()) // uuidv4 + current timestamp
    .digest('hex')
    .slice(0, 7);
}
