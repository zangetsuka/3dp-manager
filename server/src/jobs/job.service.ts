import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobType, JobStatus } from './job.entity';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async create(type: JobType, payload?: Record<string, unknown>): Promise<Job> {
    return this.jobRepo.save(
      this.jobRepo.create({
        type,
        payload: payload ? JSON.stringify(payload) : undefined,
      }),
    );
  }

  async start(id: number): Promise<Job> {
    await this.jobRepo.update(id, {
      status: 'running',
      startedAt: new Date(),
    });
    return this.jobRepo.findOne({ where: { id } });
  }

  async updateProgress(id: number, progress: number): Promise<void> {
    await this.jobRepo.update(id, { progress });
  }

  async complete(id: number, result?: string): Promise<void> {
    await this.jobRepo.update(id, {
      status: 'completed',
      progress: 100,
      result,
      completedAt: new Date(),
    });
    this.logger.log(`Job ${id} completed`);
  }

  async fail(id: number, error: string): Promise<void> {
    await this.jobRepo.update(id, {
      status: 'failed',
      error: error?.slice(0, 2000),
      completedAt: new Date(),
    });
    this.logger.error(`Job ${id} failed: ${error}`);
  }

  async findById(id: number): Promise<Job | null> {
    return this.jobRepo.findOne({ where: { id } });
  }

  async findAll(limit = 50, offset = 0): Promise<Job[]> {
    return this.jobRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async updateResult(id: number, result: string): Promise<void> {
    await this.jobRepo.update(id, { result });
  }
}
