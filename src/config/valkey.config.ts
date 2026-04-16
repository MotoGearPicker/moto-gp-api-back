import { requireEnv } from './util';

export const VALKEY_URL = () => requireEnv('REDIS_URL');
