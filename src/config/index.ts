import { optionalEnv, requireEnv } from './util';

export interface AppConfig {
  PORT: number;
  APP_ENV: string;
  APP_URL: string;
  CORS_URLS: string;
  PUBLIC_API_KEY: string;

  APP_DATABASE_URL: string;
  PRODUCTS_DATABASE_URL: string;

  REDIS_URL: string;

  JWT_ADMIN_ACCESS_SECRET: string;
  JWT_ADMIN_REFRESH_SECRET: string;
  JWT_ADMIN_RESET_SECRET: string;

  JWT_ADMIN_ACCESS_EXPIRES: string;
  JWT_ADMIN_REFRESH_EXPIRES: string;
  JWT_ADMIN_RESET_EXPIRES: string;

  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  S3_REGION: string;
  S3_ENDPOINT: string | undefined;
  S3_PUBLIC_URL: string;

  RESEND_API_KEY: string;

  SENTRY_DSN: string | undefined;
}

export const config = (): AppConfig => ({
  PORT: Number(optionalEnv('PORT', '3000')),
  APP_ENV: requireEnv('APP_ENV'),
  APP_URL: requireEnv('APP_URL'),
  CORS_URLS: optionalEnv('CORS_URLS', ''),
  PUBLIC_API_KEY: requireEnv('PUBLIC_API_KEY'),

  APP_DATABASE_URL: requireEnv('APP_DATABASE_URL'),
  PRODUCTS_DATABASE_URL: requireEnv('PRODUCTS_DATABASE_URL'),

  REDIS_URL: requireEnv('REDIS_URL'),

  JWT_ADMIN_ACCESS_SECRET: requireEnv('JWT_ADMIN_ACCESS_SECRET'),
  JWT_ADMIN_REFRESH_SECRET: requireEnv('JWT_ADMIN_REFRESH_SECRET'),
  JWT_ADMIN_RESET_SECRET: requireEnv('JWT_ADMIN_RESET_SECRET'),

  JWT_ADMIN_ACCESS_EXPIRES: optionalEnv('JWT_ADMIN_ACCESS_EXPIRES', '15m'),
  JWT_ADMIN_REFRESH_EXPIRES: optionalEnv('JWT_ADMIN_REFRESH_EXPIRES', '7d'),
  JWT_ADMIN_RESET_EXPIRES: optionalEnv('JWT_ADMIN_RESET_EXPIRES', '1h'),

  S3_ACCESS_KEY_ID: requireEnv('S3_ACCESS_KEY_ID'),
  S3_SECRET_ACCESS_KEY: requireEnv('S3_SECRET_ACCESS_KEY'),
  S3_BUCKET: requireEnv('S3_BUCKET'),
  S3_REGION: optionalEnv('S3_REGION', 'auto'),
  S3_ENDPOINT: optionalEnv('S3_ENDPOINT'),
  S3_PUBLIC_URL: optionalEnv('S3_PUBLIC_URL', ''),

  RESEND_API_KEY: requireEnv('RESEND_API_KEY'),

  SENTRY_DSN: optionalEnv('SENTRY_DSN'),
});
