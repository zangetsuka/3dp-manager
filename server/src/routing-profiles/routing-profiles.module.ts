import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutingProfilesController } from './routing-profiles.controller';
import { RoutingProfilesService } from './routing-profiles.service';
import { RoutingProfile } from './entities/routing-profile.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoutingProfile]), CommonModule],
  controllers: [RoutingProfilesController],
  providers: [RoutingProfilesService],
  exports: [RoutingProfilesService],
})
export class RoutingProfilesModule {}
