import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ColorFamily } from '../../gear/helmets/enums';
import { HelmetFinish } from '../../gear/helmets/enums';

export class ScrapedVariantDataDto {
  @IsString()
  variantName: string;

  @IsString()
  colorName: string;

  @IsArray()
  @IsEnum(ColorFamily, { each: true })
  colorFamilies: ColorFamily[];

  @IsOptional()
  @IsEnum(HelmetFinish)
  finish?: HelmetFinish | null;

  @IsOptional()
  @IsString()
  graphicName?: string | null;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsArray()
  @IsString({ each: true })
  imageUrls: string[];
}
