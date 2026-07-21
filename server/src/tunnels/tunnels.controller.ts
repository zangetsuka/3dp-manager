import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TunnelsService } from './tunnels.service';
import { CreateTunnelDto } from './dto/create-tunnel.dto';

@ApiTags('Tunnels')
@Controller('tunnels')
export class TunnelsController {
  constructor(private readonly tunnelsService: TunnelsService) {}

  @ApiOperation({ summary: 'Создать туннель', description: 'Создать новый SSH-туннель' })
  @ApiResponse({ status: 201, description: 'Туннель создан', type: CreateTunnelDto })
  @Post()
  create(@Body() createTunnelDto: CreateTunnelDto) {
    return this.tunnelsService.create(createTunnelDto);
  }

  @ApiOperation({ summary: 'Все туннели', description: 'Получить список всех туннелей' })
  @ApiResponse({ status: 200, description: 'Список туннелей' })
  @Get()
  findAll() {
    return this.tunnelsService.findAll();
  }

  @ApiOperation({ summary: 'Установить скрипт', description: 'Установить скрипт на relay-сервере' })
  @ApiResponse({ status: 201, description: 'Скрипт установлен' })
  @Post(':id/install')
  install(@Param('id') id: string) {
    return this.tunnelsService.installScript(+id);
  }

  @ApiOperation({ summary: 'Удалить скрипт', description: 'Удалить скрипт с relay-сервера' })
  @ApiResponse({ status: 201, description: 'Скрипт удалён' })
  @Post(':id/uninstall')
  uninstall(@Param('id') id: string) {
    return this.tunnelsService.uninstallScript(+id);
  }

  @ApiOperation({ summary: 'Повторить операцию', description: 'Повторить операцию установки/удаления' })
  @ApiResponse({ status: 201, description: 'Операция повторена' })
  @Post(':id/retry')
  retry(@Param('id') id: string) {
    return this.tunnelsService.retryOperation(+id);
  }

  @ApiOperation({ summary: 'Удалить туннель', description: 'Удалить туннель по ID' })
  @ApiResponse({ status: 200, description: 'Туннель удалён' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Query('deleteForwarding') deleteForwarding?: string,
  ) {
    return this.tunnelsService.remove(+id, deleteForwarding === 'true');
  }
}
