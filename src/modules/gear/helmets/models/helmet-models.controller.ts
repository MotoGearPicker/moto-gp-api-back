import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HelmetModelsService } from './helmet-models.service';
import { FilterHelmetModelsDto } from './dto/filter-helmet-models.dto';

@ApiTags('Helmets')
@Controller('gear/helmets')
export class HelmetModelsController {
  constructor(private readonly service: HelmetModelsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar cascos',
    description: 'Retorna cascos activos con sus variantes, tallas y precio mínimo por tienda. Soporta múltiples filtros.',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de cascos' })
  findAll(@Query() filters: FilterHelmetModelsDto) {
    return this.service.findAll(filters);
  }

  @Get('by-slug/:brandSlug/:modelSlug')
  @ApiOperation({
    summary: 'Obtener casco por slug',
    description: 'Retorna el detalle completo de un casco con todas sus variantes y tallas.',
  })
  @ApiParam({ name: 'brandSlug', description: 'Slug de la marca' })
  @ApiParam({ name: 'modelSlug', description: 'Slug del modelo de casco' })
  @ApiResponse({ status: 200, description: 'Detalle del casco' })
  @ApiResponse({ status: 404, description: 'Casco no encontrado' })
  findOne(
    @Param('brandSlug') brandSlug: string,
    @Param('modelSlug') modelSlug: string,
  ) {
    return this.service.findOneBySlug(brandSlug, modelSlug);
  }
}
