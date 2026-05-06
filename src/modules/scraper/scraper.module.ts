import { Module } from '@nestjs/common';
import { ScraperReviewsController } from './scraper-reviews.controller';
import { ScraperReviewsService } from './scraper-reviews.service';
import { AuthModule } from '../auth/auth.module';
import { CdnModule } from '../cdn/cdn.module';

@Module({
  imports: [AuthModule, CdnModule],
  controllers: [ScraperReviewsController],
  providers: [ScraperReviewsService],
})
export class ScraperModule {}
