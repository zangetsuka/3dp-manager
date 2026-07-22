import { Module } from '@nestjs/common';
import { HappRoutingService } from './happ-routing.service';
import { ClientIdentityService } from './client-identity.service';

@Module({
  providers: [HappRoutingService, ClientIdentityService],
  exports: [HappRoutingService, ClientIdentityService],
})
export class CommonModule {}
