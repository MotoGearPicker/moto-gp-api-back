import { Global, Logger, Module } from '@nestjs/common';
import Valkey from 'iovalkey';
import { VALKEY_URL } from '../../config/valkey.config';
import { BrandCacheService } from './brand-cache.service';
import { CacheCoordinatorService } from './cache.coordinator.service';
import { HelmetCacheService } from './helmet-cache.service';
import { VALKEY_CLIENT } from './valkey.constants';

export { VALKEY_CLIENT } from './valkey.constants';

const valkeyLogger = new Logger('ValkeyClient');

@Global()
@Module({
  providers: [
    {
      provide: VALKEY_CLIENT,
      useFactory: () => {
        const client = new Valkey(VALKEY_URL(), {
          tls: { rejectUnauthorized: false },
        });
        client.on('error', (err: Error) => valkeyLogger.error(err.message, err.stack));
        return client;
      },
    },
    HelmetCacheService,
    BrandCacheService,
    CacheCoordinatorService,
  ],
  exports: [VALKEY_CLIENT, HelmetCacheService, BrandCacheService],
})
export class ValkeyModule {}
