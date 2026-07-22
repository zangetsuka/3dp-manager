import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingProfile } from './entities/routing-profile.entity';
import { CreateRoutingProfileDto } from './dto/create-routing-profile.dto';
import { UpdateRoutingProfileDto } from './dto/update-routing-profile.dto';
import { HappRoutingService } from '../common/happ-routing.service';

@Injectable()
export class RoutingProfilesService {
  constructor(
    @InjectRepository(RoutingProfile)
    private repo: Repository<RoutingProfile>,
    private happRouting: HappRoutingService,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const profile = await this.repo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Routing profile not found');
    return profile;
  }

  async create(dto: CreateRoutingProfileDto) {
    if (dto.config) this.happRouting.validate(dto.config);
    const profile = this.repo.create({
      ...dto,
      checksum: dto.config ? this.happRouting.checksum(dto.config) : undefined,
    });
    return this.repo.save(profile);
  }

  async update(id: string, dto: UpdateRoutingProfileDto) {
    const profile = await this.findOne(id);
    if (dto.config) this.happRouting.validate(dto.config);
    Object.assign(profile, dto);
    if (dto.config) profile.checksum = this.happRouting.checksum(dto.config);
    return this.repo.save(profile);
  }

  async remove(id: string) {
    const profile = await this.findOne(id);
    return this.repo.remove(profile);
  }
}
