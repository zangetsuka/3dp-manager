import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerGroup } from './entities/customer-group.entity';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@Injectable()
export class CustomerGroupsService {
  constructor(
    @InjectRepository(CustomerGroup)
    private repo: Repository<CustomerGroup>,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['defaultRoutingProfile'], order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const group = await this.repo.findOne({ where: { id }, relations: ['defaultRoutingProfile'] });
    if (!group) throw new NotFoundException('Customer group not found');
    return group;
  }

  create(dto: CreateCustomerGroupDto) {
    const group = this.repo.create(dto);
    return this.repo.save(group);
  }

  async update(id: string, dto: UpdateCustomerGroupDto) {
    const group = await this.findOne(id);
    Object.assign(group, dto);
    return this.repo.save(group);
  }

  async remove(id: string) {
    const group = await this.findOne(id);
    return this.repo.remove(group);
  }
}
