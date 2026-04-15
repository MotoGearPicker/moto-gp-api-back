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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AdminAccessTokenGuard } from '../auth/guards';
import { StoresAdminService } from './stores.admin.service';
import { CreateStoreDto } from './dto/create-store.dto';

@UseGuards(AdminAccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Admin — Stores')
@Controller('admin/stores')
export class StoresAdminController {
  constructor(private readonly service: StoresAdminService) {}

  @Get()
  @ApiOperation({ summary: '[Admin] Listar todas las tiendas (incluye eliminadas)' })
  @ApiResponse({ status: 200, description: 'Lista de tiendas' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Obtener tienda por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la tienda' })
  @ApiResponse({ status: 200, description: 'Detalle de la tienda' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: '[Admin] Crear tienda afiliada',
    description: 'Crea una tienda. Si se adjunta un logo (campo "logo"), se sube a S3 y se guarda la URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'domain'],
      properties: {
        name: { type: 'string', example: 'MotoFull' },
        domain: { type: 'string', example: 'motofull.com' },
        affiliateProgram: { type: 'string', example: 'TradeDoubler' },
        commissionPct: { type: 'number', example: 5.5 },
        logo: { type: 'string', format: 'binary', description: 'Imagen del logo (opcional)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Tienda creada' })
  @ApiResponse({ status: 409, description: 'Ya existe una tienda con ese dominio' })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Solo se permiten imágenes'), false);
        }
        cb(null, true);
      },
    }),
  )
  create(@Body() dto: CreateStoreDto, @UploadedFile() logo?: Express.Multer.File) {
    return this.service.create(dto, logo);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Eliminar tienda (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID de la tienda' })
  @ApiResponse({ status: 204, description: 'Tienda eliminada' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: '[Admin] Restaurar tienda eliminada' })
  @ApiParam({ name: 'id', description: 'UUID de la tienda' })
  @ApiResponse({ status: 201, description: 'Tienda restaurada' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.restore(id);
  }
}
