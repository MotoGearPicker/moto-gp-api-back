import { Module } from '@nestjs/common';
import { GearModule } from './modules/gear/gear.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './modules/logger';
import { BackupModule } from './modules/backup/backup.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { S3Module } from './modules/s3/s3.module';
import { StoresModule } from './modules/stores/stores.module';

@Module({
  imports: [PrismaModule, LoggerModule, S3Module, GearModule, AuthModule, BackupModule, ScraperModule, StoresModule],
})
export class AppModule {}
