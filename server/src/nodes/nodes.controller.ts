import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateNodeDto, UpdateNodeDto } from './dto/node.dto';
import { NodesService } from './nodes.service';

@ApiTags('Nodes')
@Controller('nodes')
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @ApiOperation({ summary: 'Все узлы', description: 'Получить список всех узлов' })
  @ApiResponse({ status: 200, description: 'Список узлов' })
  @Get()
  findAll() {
    return this.nodesService.findAll();
  }

  @ApiOperation({ summary: 'Создать узел', description: 'Добавить новый узел' })
  @ApiResponse({ status: 201, description: 'Узел создан', type: CreateNodeDto })
  @Post()
  create(@Body() dto: CreateNodeDto) {
    return this.nodesService.create(dto);
  }

  @ApiOperation({ summary: 'Проверить узел', description: 'Проверить подключение к узлу по переданным данным' })
  @ApiResponse({ status: 201, description: 'Результат проверки' })
  @Post('check')
  checkPayload(@Body() dto: CreateNodeDto) {
    return this.nodesService.checkPayload(dto);
  }

  @ApiOperation({ summary: 'Определить местоположение', description: 'Определить страну по URL узла' })
  @ApiResponse({ status: 201, description: 'Информация о местоположении' })
  @Post('detect-location')
  detectLocation(@Body() body: { url: string }) {
    return this.nodesService.detectLocation(body.url);
  }

  @ApiOperation({ summary: 'Обновить узел', description: 'Обновить данные узла по ID' })
  @ApiResponse({ status: 200, description: 'Узел обновлён' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNodeDto) {
    return this.nodesService.update(id, dto);
  }

  @ApiOperation({ summary: 'Удалить узел', description: 'Удалить узел по ID' })
  @ApiResponse({ status: 200, description: 'Узел удалён' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nodesService.remove(id);
  }

  @ApiOperation({ summary: 'Установить главным', description: 'Сделать узел главным' })
  @ApiResponse({ status: 201, description: 'Статус обновлён' })
  @Post(':id/main')
  setMain(@Param('id') id: string) {
    return this.nodesService.setMain(id);
  }

  @ApiOperation({ summary: 'Проверить соединение', description: 'Проверить соединение с узлом по ID' })
  @ApiResponse({ status: 201, description: 'Результат проверки соединения' })
  @Post(':id/check')
  check(@Param('id') id: string) {
    return this.nodesService.checkConnection(id);
  }

  @ApiOperation({ summary: 'Синхронизация с главного узла', description: 'Синхронизировать данные с главного узла' })
  @ApiResponse({ status: 201, description: 'Синхронизация выполнена' })
  @Post('sync/main')
  syncFromMain() {
    return this.nodesService.syncFromMain();
  }
}
