import { S3Client } from '@aws-sdk/client-s3';
import { requireEnv, optionalEnv } from './util';

export const createS3Client = (): S3Client =>
  new S3Client({
    region: optionalEnv('S3_REGION', 'us-east-1'),
    endpoint: requireEnv('S3_ENDPOINT'),
    forcePathStyle: true, // requerido por Supabase Storage y otros providers S3-compatibles
    credentials: {
      accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
    },
  });

export const S3_BUCKET = () => requireEnv('S3_BUCKET');