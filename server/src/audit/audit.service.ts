import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: string;
    entityType?: string;
    entityId?: string;
    detail?: string;
    ip?: string;
  }) {
    const entry = this.auditRepo.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      detail: params.detail?.slice(0, 1000),
      ip: params.ip,
    });
    await this.auditRepo.save(entry);
  }

  async findAll(limit = 100, offset = 0) {
    return this.auditRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async count(): Promise<number> {
    return this.auditRepo.count();
  }
}
