import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomerGroupsService } from './customer-groups.service';
import { CreateCustomerGroupDto } from './dto/create-customer-group.dto';
import { UpdateCustomerGroupDto } from './dto/update-customer-group.dto';

@ApiTags('Customer Groups')
@Controller('customer-groups')
export class CustomerGroupsController {
  constructor(private readonly service: CustomerGroupsService) {}

  @ApiOperation({ summary: 'All customer groups' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get customer group by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create customer group' })
  @Post()
  create(@Body() dto: CreateCustomerGroupDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update customer group' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerGroupDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete customer group' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
