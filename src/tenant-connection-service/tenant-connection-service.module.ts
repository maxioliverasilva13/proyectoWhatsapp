import { Module } from '@nestjs/common';
import { TenantConnectionService } from './tenant-connection-service.service';
import { EmpresaService } from 'src/empresa/empresa.service';
import { EmpresaModule } from 'src/empresa/empresa.module';

@Module({
  imports: [EmpresaModule],
  providers: [TenantConnectionService, EmpresaService],
  exports: [TenantConnectionService],
})
export class TenantConnectionModule {}
