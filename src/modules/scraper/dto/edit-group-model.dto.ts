import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScrapedModelDataDto } from './scraped-model-data.dto';

export class EditGroupModelDto {
  @ValidateNested()
  @Type(() => ScrapedModelDataDto)
  editedModelData: ScrapedModelDataDto;
}
