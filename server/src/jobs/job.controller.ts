import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobService } from './job.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Jobs')
@Controller('api/jobs')
@UseGuards(JwtAuthGuard)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({ summary: 'Все задачи', description: 'Получить список задач ротации с пагинацией' })
  @ApiResponse({ status: 200, description: 'Список задач' })
  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.jobService.findAll(
      Math.min(parseInt(limit || '50', 10) || 50, 200),
      parseInt(offset || '0', 10) || 0,
    );
  }

  @ApiOperation({ summary: 'Найти задачу', description: 'Получить задачу ротации по ID' })
  @ApiResponse({ status: 200, description: 'Информация о задаче' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.jobService.findById(parseInt(id, 10));
  }
}
