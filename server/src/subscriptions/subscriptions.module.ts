import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { Inbound } from '../inbounds/entities/inbound.entity';
import { XuiModule } from '../xui/xui.module';
import { AuditModule } from '../audit/audit.module';
import { Node } from '../nodes/entities/node.entity';
import { Tunnel } from '../tunnels/entities/tunnel.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerGroup } from '../customer-groups/entities/customer-group.entity';
import { RoutingProfile } from '../routing-profiles/entities/routing-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Inbound, Node, Tunnel, Customer, CustomerGroup, RoutingProfile]),
    XuiModule,
    AuditModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
