import { Module } from '@nestjs/common';
import { CdnImagesService } from './cdn-images.service';

@Module({
  providers: [CdnImagesService],
  exports: [CdnImagesService],
})
export class CdnModule {}
