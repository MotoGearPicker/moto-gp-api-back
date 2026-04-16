import { Global, Module } from '@nestjs/common';
import Valkey from 'iovalkey';
import { VALKEY_URL } from '../../config/valkey.config';

export const VALKEY_CLIENT = 'VALKEY_CLIENT';

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
  ],
  exports: [VALKEY_CLIENT],
})
export class ValkeyModule {}
