import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStoreDto {
  @ApiProperty({ example: 'MotoFull', description: 'Nombre de la tienda' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'motofull.com', description: 'Dominio único de la tienda' })
  @IsString()
  @MaxLength(100)
  @Matches(/^(?!https?:\/\/)[\w.-]+\.[a-z]{2,}$/, {
    message: 'domain debe ser solo el dominio sin protocolo (ej: motofull.com)',
  })
  domain: string;

  @ApiPropertyOptional({ example: 'TradeDoubler', description: 'Red de afiliados' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  affiliateProgram?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Comisión en porcentaje (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  commissionPct?: number;
}
