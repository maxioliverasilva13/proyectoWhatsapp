import { Module } from '@nestjs/common';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { PlanEmpresa } from 'src/planEmpresa/entities/planEmpresa.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Plan, PlanEmpresa])],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
