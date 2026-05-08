import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { config } from '../../config';

const env = config();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.APP_ENV,
    sendDefaultPii: true,
    tracesSampleRate: env.APP_ENV === 'local' ? 1.0 : 0.2,
  });
}
