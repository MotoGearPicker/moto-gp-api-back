import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminAccessTokenGuard } from '../../../auth/guards';
import { HelmetModelsAdminService } from './helmet-models-admin.service';
import { CreateHelmetModelDto } from './dto/create-helmet-model.dto';
import { UpdateHelmetModelDto } from './dto/update-helmet-model.dto';
import { FilterHelmetModelsAdminDto } from './dto/filter-helmet-models-admin.dto';

@UseGuards(AdminAccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Admin — Helmets')
@Controller('admin/gear/helmets')
export class HelmetModelsAdminController {
  constructor(private readonly service: HelmetModelsAdminService) {}

  @Get()
  @ApiOperation({
    summary: '[Admin] Listar modelos de casco',
    description: 'Listado plano de HelmetModel con filtros administrativos avanzados (sin relaciones de variantes).',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de modelos (vista admin, sin variantes)' })
  findAll(@Query() filters: FilterHelmetModelsAdminDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: '[Admin] Obtener casco por ID',
    description: 'Incluye todos los campos internos y variantes eliminadas.',
  })
  @ApiParam({ name: 'id', description: 'UUID del modelo de casco' })
  @ApiResponse({ status: 200, description: 'Detalle completo del casco (vista admin)' })
  @ApiResponse({ status: 404, description: 'Casco no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Crear modelo de casco' })
  @ApiBody({ type: CreateHelmetModelDto })
  @ApiResponse({ status: 201, description: 'Casco creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() dto: CreateHelmetModelDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: '[Admin] Actualizar modelo de casco',
    description: 'Todos los campos son opcionales (actualización parcial).',
  })
  @ApiParam({ name: 'id', description: 'UUID del modelo de casco' })
  @ApiBody({ type: UpdateHelmetModelDto })
  @ApiResponse({ status: 200, description: 'Casco actualizado' })
  @ApiResponse({ status: 404, description: 'Casco no encontrado' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateHelmetModelDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '[Admin] Eliminar casco (soft delete)',
    description: 'Marca el casco como eliminado sin borrarlo de la base de datos. Restaurable con /restore.',
  })
  @ApiParam({ name: 'id', description: 'UUID del modelo de casco' })
  @ApiResponse({ status: 204, description: 'Casco eliminado (soft delete)' })
  @ApiResponse({ status: 404, description: 'Casco no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: '[Admin] Restaurar casco eliminado',
    description: 'Revierte el soft delete, el casco vuelve al estado activo.',
  })
  @ApiParam({ name: 'id', description: 'UUID del modelo de casco' })
  @ApiResponse({ status: 201, description: 'Casco restaurado' })
  @ApiResponse({ status: 404, description: 'Casco no encontrado' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }
}
