import { Module } from '@nestjs/common';
import { CatalogCacheService } from '../../valkey/catalog-cache.service';
import { HelmetModelsService } from './models/helmet-models.service';
import { HelmetModelsAdminService } from './models/helmet-models-admin.service';
import { HelmetModelsController } from './models/helmet-models.controller';
import { HelmetModelsAdminController } from './models/helmet-models.admin.controller';
import { HelmetVariantsService } from './variants/helmet-variants.service';
import { HelmetVariantsAdminController } from './variants/helmet-variants.admin.controller';
import { HelmetSizesService } from './sizes/helmet-sizes.service';
import { HelmetSizesAdminController } from './sizes/helmet-sizes.admin.controller';
import { HelmetInventoryService } from './inventory/helmet-inventory.service';
import { HelmetInventoryAdminController } from './inventory/helmet-inventory.admin.controller';

@Module({
  controllers: [
    HelmetModelsController,
    HelmetVariantsAdminController,   // Debe ir antes que HelmetModelsAdminController para que
    HelmetModelsAdminController,     // /admin/gear/helmets/variants no sea capturado por /:id
    HelmetSizesAdminController,
    HelmetInventoryAdminController,
  ],
  providers: [
    CatalogCacheService,
    HelmetModelsService,
    HelmetModelsAdminService,
    HelmetVariantsService,
    HelmetSizesService,
    HelmetInventoryService,
  ],
})
export class HelmetsModule {}
