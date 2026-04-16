import { Global, Module } from '@nestjs/common';
import Valkey from 'iovalkey';
import { VALKEY_URL } from '../../config/valkey.config';
import { BrandCacheService } from './brand-cache.service';
import { CacheCoordinatorService } from './cache.coordinator.service';
import { HelmetCacheService } from './helmet-cache.service';
import { VALKEY_CLIENT } from './valkey.constants';

export { VALKEY_CLIENT } from './valkey.constants';

@Global()
@Module({
  providers: [
    {
      provide: VALKEY_CLIENT,
      useFactory: () => {
        return new Valkey(VALKEY_URL(), {
          tls: { rejectUnauthorized: false },
        });
      },
    },
    HelmetCacheService,
    BrandCacheService,
    CacheCoordinatorService,
  ],
  exports: [VALKEY_CLIENT, HelmetCacheService, BrandCacheService],
})
export class ValkeyModule {}
