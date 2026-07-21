import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RotationService } from './rotation.service';

@ApiTags('Rotation')
@Controller('rotation')
export class RotationController {
  constructor(private readonly rotationService: RotationService) {}

  @ApiOperation({ summary: 'Ротация всех подписок', description: 'Запустить ротацию для всех подписок' })
  @ApiResponse({ status: 201, description: 'Ротация запущена' })
  @Post('rotate-all')
  async rotateAll() {
    return this.rotationService.performRotation();
  }

  @ApiOperation({ summary: 'Ротация одной подписки', description: 'Запустить ротацию для одной подписки по ID' })
  @ApiResponse({ status: 201, description: 'Ротация запущена' })
  @Post('rotate-one/:id')
  async rotateSingle(@Param('id') id: string) {
    return this.rotationService.rotateSingleSubscription(id);
  }

  @ApiOperation({ summary: 'Откат ротации', description: 'Откатить ротацию по ID задачи' })
  @ApiResponse({ status: 201, description: 'Откат выполнен' })
  @Post('rollback/:jobId')
  async rollback(@Param('jobId') jobId: string) {
    return this.rotationService.rollbackRotation(parseInt(jobId, 10));
  }
}
