import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { HelmetType } from '../../gear/helmets/enums';
import { HelmetShellMaterial } from '../../gear/helmets/enums';
import { VisorPinlock } from '../../gear/helmets/enums';
import { HelmetClosureType } from '../../gear/helmets/enums';
import { HelmetCertification } from '../../gear/helmets/enums';

export class ScrapedModelDataDto {
  @IsString()
  modelName: string;

  @IsString()
  modelSlug: string;

  @IsString()
  brandSlug: string;

  @IsArray()
  @IsEnum(HelmetType, { each: true })
  helmetType: HelmetType[];

  @IsOptional()
  @IsInt()
  @Min(1)
  safetyRating?: number | null;

  @IsArray()
  @IsEnum(HelmetShellMaterial, { each: true })
  shellMaterial: HelmetShellMaterial[];

  @IsOptional()
  @IsInt()
  @Min(1)
  shellSizes?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  weightGrams?: number | null;

  @IsBoolean()
  visorAntiScratch: boolean;

  @IsBoolean()
  visorAntiFog: boolean;

  @IsArray()
  @IsEnum(VisorPinlock, { each: true })
  visorPinlockCompatible: VisorPinlock[];

  @IsBoolean()
  visorPinlockIncluded: boolean;

  @IsOptional()
  @IsString()
  pinlockDksCode?: string | null;

  @IsBoolean()
  tearOffCompatible: boolean;

  @IsBoolean()
  sunVisor: boolean;

  @IsOptional()
  @IsString()
  sunVisorType?: string | null;

  @IsBoolean()
  intercomReady: boolean;

  @IsOptional()
  @IsString()
  intercomDesignedBrand?: string | null;

  @IsOptional()
  @IsString()
  intercomDesignedModel?: string | null;

  @IsBoolean()
  removableLining: boolean;

  @IsBoolean()
  washableLining: boolean;

  @IsBoolean()
  emergencyRelease: boolean;

  @IsOptional()
  @IsEnum(HelmetClosureType)
  closureType?: HelmetClosureType | null;

  @IsArray()
  @IsEnum(HelmetCertification, { each: true })
  certification: HelmetCertification[];

  @IsArray()
  @IsString({ each: true })
  includedAccessories: string[];

  @IsArray()
  @IsString({ each: true })
  sizes: string[];
}
