import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresAdminController } from './stores.admin.controller';
import { StoresService } from './stores.service';
import { StoresAdminService } from './stores.admin.service';
import { StoresRepository } from './stores.repository';

@Module({
  controllers: [StoresController, StoresAdminController],
  providers: [StoresRepository, StoresService, StoresAdminService],
})
export class StoresModule {}
