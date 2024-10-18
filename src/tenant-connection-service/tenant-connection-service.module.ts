import { Module } from '@nestjs/common';
import { TenantConnectionService } from './tenant-connection-service.service';

@Module({
  imports: [],
  providers: [TenantConnectionService],
  exports: [TenantConnectionService],
})
export class TenantConnectionModule {}
