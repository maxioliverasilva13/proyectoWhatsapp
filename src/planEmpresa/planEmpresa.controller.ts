import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { PlanEmpresaService } from './planEmpresa.service';
import { CreatePlanEmpresaDto } from './dto/create-planEmpresa.dto';

@Controller('planEmpresa')
export class PlanEmpresaControllerr {
  constructor(private readonly planEmpresaService: PlanEmpresaService) {}

  @Post()
  async create(@Body() CreatePlanEmpresaDto : CreatePlanEmpresaDto ) {
    return this.planEmpresaService.create(CreatePlanEmpresaDto)
  }

}
