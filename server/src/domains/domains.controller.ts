import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { DomainScannerService } from './domain-scanner.service';

@ApiTags('Domains')
@Controller('domains')
export class DomainsController {
  constructor(
    private readonly domainsService: DomainsService,
    private readonly domainScannerService: DomainScannerService,
  ) {}

  @ApiOperation({ summary: 'Создать домен', description: 'Добавить новый домен' })
  @ApiResponse({ status: 201, description: 'Домен создан' })
  @Post()
  create(@Body() body: { name: string }) {
    return this.domainsService.create(body);
  }

  @ApiOperation({ summary: 'Загрузить домены', description: 'Массовая загрузка доменов' })
  @ApiResponse({ status: 201, description: 'Домены загружены' })
  @Post('upload')
  uploadMany(@Body() body: { domains: string[] }) {
    return this.domainsService.createMany(body.domains);
  }

  @ApiOperation({ summary: 'Возможности сканера', description: 'Получить информацию о возможностях сканера доменов' })
  @ApiResponse({ status: 200, description: 'Возможности сканера' })
  @Get('scan/capabilities')
  scanCapabilities() {
    return this.domainScannerService.getCapabilities();
  }

  @ApiOperation({ summary: 'Статус сканирования', description: 'Получить текущий статус сканирования' })
  @ApiResponse({ status: 200, description: 'Статус сканирования' })
  @Get('scan/status')
  scanStatus() {
    return this.domainScannerService.getScanStatus();
  }

  @ApiOperation({ summary: 'Последний результат', description: 'Получить результат последнего сканирования' })
  @ApiResponse({ status: 200, description: 'Результат сканирования' })
  @Get('scan/last-result')
  lastScanResult() {
    return this.domainScannerService.getLastScanResult();
  }

  @ApiOperation({ summary: 'Запустить сканирование', description: 'Запустить сканирование доменов' })
  @ApiResponse({ status: 201, description: 'Сканирование запущено' })
  @Post('scan/start')
  startScan(
    @Body()
    body: {
      addr: string;
      scanSeconds?: number;
      thread?: number;
      timeout?: number;
    },
  ) {
    return this.domainScannerService.startScan(body);
  }

  @ApiOperation({ summary: 'Все домены', description: 'Получить все домены без пагинации' })
  @ApiResponse({ status: 200, description: 'Список доменов' })
  @Get('all')
  findAllWithoutPagination() {
    return this.domainsService.findAllUnpaginated();
  }

  @ApiOperation({ summary: 'Все домены (с пагинацией)', description: 'Получить домены с пагинацией' })
  @ApiResponse({ status: 200, description: 'Список доменов' })
  @Get()
  findAll(@Query('page') page: number, @Query('limit') limit: number) {
    const pageNum = page ? +page : 1;
    const limitNum = limit ? +limit : 10;

    return this.domainsService.findAll(pageNum, limitNum);
  }

  @ApiOperation({ summary: 'Найти домен', description: 'Получить домен по ID' })
  @ApiResponse({ status: 200, description: 'Информация о домене' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.domainsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Удалить все домены', description: 'Удалить все домены' })
  @ApiResponse({ status: 200, description: 'Домены удалены' })
  @Delete('all')
  removeAll() {
    return this.domainsService.removeAll();
  }

  @ApiOperation({ summary: 'Удалить домен', description: 'Удалить домен по ID' })
  @ApiResponse({ status: 200, description: 'Домен удалён' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.domainsService.remove(+id);
  }
}
