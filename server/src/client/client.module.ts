import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './client.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Tunnel } from 'src/tunnels/entities/tunnel.entity';
import { RoutingProfile } from '../routing-profiles/entities/routing-profile.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Tunnel, RoutingProfile]),
    CacheModule.register(),
    CommonModule,
  ],
  controllers: [ClientController],
})
export class ClientModule {}
