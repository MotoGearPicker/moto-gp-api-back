import { S3Client } from '@aws-sdk/client-s3';
import { requireEnv, optionalEnv } from './util';

export const createS3Client = (): S3Client => {
  const endpoint = optionalEnv('S3_ENDPOINT');
  return new S3Client({
    region: optionalEnv('S3_REGION', 'us-east-1'),
    credentials: {
      accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
    },
    ...(endpoint && { endpoint, forcePathStyle: true }),
  });
};

export const S3_BUCKET = () => requireEnv('S3_BUCKET');