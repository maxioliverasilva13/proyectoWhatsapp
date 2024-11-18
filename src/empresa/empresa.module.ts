import { Module } from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { Empresa } from './entities/empresa.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Empresa]), TypeOrmModule.forFeature([Tiposervicio]), TypeOrmModule.forFeature([Usuario])],
  controllers: [EmpresaController],
  providers: [EmpresaService, TenantConnectionService],
  exports: [EmpresaService, TypeOrmModule],
})
export class EmpresaModule {}
