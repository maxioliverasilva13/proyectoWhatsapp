import { Module } from '@nestjs/common';
import { PlanEmpresaService } from './planEmpresa.service';
import { PlanEmpresaControllerr } from './planEmpresa.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEmpresa } from './entities/planEmpresa.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEmpresa, Empresa, Plan])],
  controllers: [PlanEmpresaControllerr],
  providers: [PlanEmpresaService],
  exports: [PlanEmpresaService, TypeOrmModule],
})
export class PlanEmpresaModule {}
