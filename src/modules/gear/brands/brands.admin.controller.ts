import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { IsEnum, IsOptional } from 'class-validator';
import { AdminAccessTokenGuard } from '../../auth/guards';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { GearType } from '../common/enums/gear-type.enum';

class BrandsQueryDto {
  @IsOptional()
  @IsEnum(GearType)
  category?: GearType;
}

@SkipThrottle()
@UseGuards(AdminAccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Admin — Brands')
@Controller('admin/gear/brands')
export class BrandsAdminController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @ApiOperation({
    summary: '[Admin] Listar marcas',
    description: 'Sin `category` devuelve todas las marcas activas. Con `category` filtra solo las que tienen productos activos en esa categoría.',
  })
  @ApiQuery({ name: 'category', required: false, enum: GearType })
  @ApiResponse({ status: 200, description: 'Lista de marcas' })
  findAll(@Query() query: BrandsQueryDto) {
    return this.service.findAll(query.category);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Crear marca' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'Marca creada' })
  @ApiResponse({ status: 409, description: 'Ya existe una marca con ese nombre o slug' })
  create(@Body() dto: CreateBrandDto) {
    return this.service.create(dto);
  }
}
