import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoresService } from './stores.service';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly service: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tiendas afiliadas activas' })
  @ApiResponse({ status: 200, description: 'Lista de tiendas' })
  findAll() {
    return this.service.findAll();
  }
}