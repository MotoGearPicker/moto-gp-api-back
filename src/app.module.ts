import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GearModule } from './modules/gear/gear.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './modules/logger';
import { BackupModule } from './modules/backup/backup.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { S3Module } from './modules/s3/s3.module';
import { StoresModule } from './modules/stores/stores.module';
import { ContactModule } from './modules/contact/contact.module';
import { SecurityModule } from './modules/security/security.module';
import { ValkeyModule } from './modules/valkey/valkey.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SecurityModule,
    PrismaModule,
    LoggerModule,
    S3Module,
    ValkeyModule,
    GearModule,
    AuthModule,
    BackupModule,
    ScraperModule,
    StoresModule,
    ContactModule,
  ],
})
export class AppModule {}
