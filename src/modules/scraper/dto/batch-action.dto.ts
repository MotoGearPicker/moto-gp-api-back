import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class BatchApproveDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  reviewIds?: string[];
}

export class BatchRejectDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  reviewIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string | null;
}
