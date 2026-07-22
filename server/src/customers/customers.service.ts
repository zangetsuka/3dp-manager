import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>,
  ) {}

  findAll() {
    return this.repo.find({ relations: ['subscriptions'], order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const customer = await this.repo.findOne({ where: { id }, relations: ['subscriptions'] });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const customer = this.repo.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
    return this.repo.save(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    if (dto.expiresAt) customer.expiresAt = new Date(dto.expiresAt);
    return this.repo.save(customer);
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    return this.repo.remove(customer);
  }
}
