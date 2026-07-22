import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RoutingProfilesService } from './routing-profiles.service';
import { CreateRoutingProfileDto } from './dto/create-routing-profile.dto';
import { UpdateRoutingProfileDto } from './dto/update-routing-profile.dto';

@ApiTags('Routing Profiles')
@Controller('routing-profiles')
export class RoutingProfilesController {
  constructor(private readonly service: RoutingProfilesService) {}

  @ApiOperation({ summary: 'All routing profiles' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get routing profile by ID' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Create routing profile' })
  @Post()
  create(@Body() dto: CreateRoutingProfileDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'Update routing profile' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoutingProfileDto) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete routing profile' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
