import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../../../common/pagination';
import {
  ColorFamily,
  HelmetCertification,
  HelmetClosureType,
  HelmetFinish,
  HelmetPurpose,
  HelmetShape,
  HelmetShellMaterial,
  VisorPinlock,
} from '../../enums';

export class FilterHelmetModelsDto extends PaginationDto {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  brandSlug?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(HelmetShape, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  shape?: HelmetShape[];

  @IsOptional()
  @IsArray()
  @IsEnum(HelmetPurpose, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  purpose?: HelmetPurpose[];

  @IsOptional()
  @IsArray()
  @IsEnum(HelmetShellMaterial, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  shellMaterial?: HelmetShellMaterial[];

  @IsOptional()
  @IsEnum(HelmetClosureType)
  closureType?: HelmetClosureType;

  @IsOptional()
  @IsArray()
  @IsEnum(VisorPinlock, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  visorPinlockCompatible?: VisorPinlock[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  visorPinlockIncluded?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  tearOffCompatible?: boolean;

  @IsOptional()
  @IsEnum(HelmetCertification, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  certification?: HelmetCertification[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minShellSizes?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(HelmetFinish, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  finish?: HelmetFinish[];

  @IsOptional()
  @IsArray()
  @IsEnum(ColorFamily, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  colorFamily?: ColorFamily[];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  exclusive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  sunVisor?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  intercomReady?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minSafetyRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxWeightGrams?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  emergencyRelease?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
