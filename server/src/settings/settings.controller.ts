import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import * as net from 'net';
import * as dns from 'dns/promises';
import { COUNTRIES } from './countries';
import { XuiService } from 'src/xui/xui.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  private readonly logger = new Logger(SettingsController.name);

  constructor(
    @InjectRepository(Setting)
    private settingsRepo: Repository<Setting>,
    private xuiService: XuiService,
  ) {}

  @ApiOperation({ summary: 'Все настройки', description: 'Получить все настройки системы' })
  @ApiResponse({ status: 200, description: 'Объект настроек' })
  @Get()
  async findAll() {
    const settings = await this.settingsRepo.find();
    return settings.reduce(
      (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
      {},
    );
  }

  @ApiOperation({ summary: 'Список стран', description: 'Получить список стран для геолокации' })
  @ApiResponse({ status: 200, description: 'Список стран' })
  @Get('countries')
  countries() {
    return COUNTRIES;
  }

  @ApiOperation({ summary: 'Проверить подключение к XUI', description: 'Проверить соединение с 3x-ui панелью' })
  @ApiResponse({ status: 201, description: 'Результат проверки' })
  @Post('check')
  async checkConnection(
    @Body() body: { xui_url: string; xui_login: string; xui_password: string },
  ) {
    const success = await this.xuiService.checkConnection(
      body.xui_url,
      body.xui_login,
      body.xui_password,
    );
    return { success };
  }

  @ApiOperation({ summary: 'Сохранить настройки', description: 'Сохранить настройки системы' })
  @ApiResponse({ status: 201, description: 'Настройки сохранены' })
  @Post()
  async update(@Body() settings: Record<string, string>) {
    if (settings.xui_url) {
      try {
        const parsed = new URL(settings.xui_url);
        settings['xui_host'] = parsed.hostname;

        let address = '';
        if (net.isIP(parsed.hostname) === 0) {
          const result = await dns.lookup(parsed.hostname);
          address = result.address;
        } else {
          address = parsed.hostname;
        }

        settings['xui_ip'] = address;
        this.logger.log(
          `Extracted host: ${parsed.hostname} from ${settings.xui_url}`,
        );

        if (address && address !== '127.0.0.1' && address !== 'localhost') {
          try {
            this.logger.log(`Определяем страну для IP: ${address}...`);
            const geoRes = await fetch(`http://ip-api.com/json/${address}`, {
              signal: AbortSignal.timeout(5000),
            });
            const geoData = (await geoRes.json()) as {
              status: string;
              countryCode?: string;
              country?: string;
              message?: string;
            };

            if (geoData.status === 'success') {
              const countryCode = geoData.countryCode;

              const countryInfo = COUNTRIES.find((c) => c.code === countryCode);

              if (countryInfo) {
                const flagEmoji = countryInfo.emoji;

                settings['xui_geo_country'] = countryInfo.name;
                settings['xui_geo_flag'] = flagEmoji;

                this.logger.log(
                  `GeoIP Success: ${countryInfo.name} ${flagEmoji}`,
                );
              } else {
                this.logger.warn(
                  `Страна с кодом ${countryCode} не найдена в countries.ts`,
                );
                settings['xui_geo_country'] = geoData.country;
                settings['xui_geo_flag'] = '';
              }
            } else {
              this.logger.warn(
                `GeoIP Error: ${(geoData as { message?: string }).message}`,
              );
            }
          } catch (geoError) {
            this.logger.error(
              `Ошибка запроса к ip-api.com: ${(geoError as Error).message}`,
            );
          }
        }
      } catch {
        this.logger.warn(`Не удалось извлечь хост из URL: ${settings.xui_url}`);
      }
    }
    for (const [key, value] of Object.entries(settings)) {
      await this.settingsRepo.save({ key, value });
    }
    this.logger.log('Settings saved to database');
    return { success: true };
  }
}
