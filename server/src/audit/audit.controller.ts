import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Audit')
@Controller('api/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'Логи аудита', description: 'Получить логи аудита с пагинацией' })
  @ApiResponse({ status: 200, description: 'Логи аудита' })
  @Get()
  async findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const items = await this.auditService.findAll(
      Math.min(parseInt(limit || '100', 10) || 100, 500),
      parseInt(offset || '0', 10) || 0,
    );
    const total = await this.auditService.count();
    return { items, total };
  }
}
