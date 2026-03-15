import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScrapedModelDataDto } from './scraped-model-data.dto';
import { ScrapedVariantDataDto } from './scraped-variant-data.dto';

export class UpdateReviewDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ScrapedModelDataDto)
  editedModelData?: ScrapedModelDataDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ScrapedVariantDataDto)
  editedVariantData?: ScrapedVariantDataDto | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
