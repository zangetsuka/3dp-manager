import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Put,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: 'Все подписки', description: 'Получить список всех подписок' })
  @ApiResponse({ status: 200, description: 'Список подписок' })
  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @ApiOperation({ summary: 'Создать подписку', description: 'Создать новую подписку' })
  @ApiResponse({ status: 201, description: 'Подписка создана', type: CreateSubscriptionDto })
  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @ApiOperation({ summary: 'Массовое обновление авто-ротации', description: 'Включить/отключить авто-ротацию для нескольких подписок' })
  @ApiResponse({ status: 200, description: 'Результат обновления' })
  @Put('bulk-auto-rotation')
  @HttpCode(HttpStatus.OK)
  async bulkUpdateAutoRotation(
    @Body() body: { subscriptionIds: string[]; enabled: boolean },
  ) {
    const { subscriptionIds, enabled } = body;

    if (!Array.isArray(subscriptionIds)) {
      return {
        success: false,
        message: 'subscriptionIds должен быть массивом',
      };
    }

    if (subscriptionIds.length > 100) {
      return {
        success: false,
        message: 'Максимум 100 ID за раз',
      };
    }

    const updated: string[] = [];
    const notFound: string[] = [];

    for (const id of subscriptionIds) {
      const result = await this.subscriptionsService.update(id, {
        isAutoRotationEnabled: enabled,
      });

      if (result) {
        updated.push(id);
      } else {
        notFound.push(id);
      }
    }

    return {
      success: true,
      message: `Обновлено ${updated.length} подписок`,
      updatedCount: updated.length,
      notFound: notFound.length > 0 ? notFound : undefined,
    };
  }

  @ApiOperation({ summary: 'Обновить подписку', description: 'Обновить данные подписки по ID' })
  @ApiResponse({ status: 200, description: 'Подписка обновлена' })
  @ApiResponse({ status: 404, description: 'Подписка не найдена' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const result = await this.subscriptionsService.update(
      id,
      updateSubscriptionDto,
    );
    if (!result) {
      throw new NotFoundException(`Подписка ${id} не найдена`);
    }
    return result;
  }

  @ApiOperation({ summary: 'Удалить подписку', description: 'Удалить подписку по ID' })
  @ApiResponse({ status: 200, description: 'Подписка удалена' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
