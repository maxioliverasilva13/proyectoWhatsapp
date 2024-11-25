import { BadRequestException, Injectable } from '@nestjs/common';
import { PlanEmpresa } from './entities/planEmpresa.entity';
import { CreatePlanEmpresaDto } from './dto/create-planEmpresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from 'src/plan/entities/plan.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';


@Injectable()
export class PlanEmpresaService {

  constructor(
    @InjectRepository(PlanEmpresa)
    private planEmpresaRepository : Repository<PlanEmpresa>,
    @InjectRepository(Plan)
    private planRepository : Repository<Plan>,
    @InjectRepository(Empresa)
    private empresaRepository : Repository<Empresa>

  ){}

  async create(data : CreatePlanEmpresaDto) {
    try {
      const newPlanEmpresa = new PlanEmpresa;

      const empresaExist = await this.empresaRepository.findOne({where:{id:data.id_empresa}})

      if(!empresaExist) {
        throw new BadRequestException(`there is no company with id ${data.id_empresa}`)
      }

      const planExist = await this.planRepository.findOne({where:{id:data.id_plan}})

      if(!planExist) {
        throw new BadRequestException(`there is no plan with id ${data.id_plan}`)
      }

      newPlanEmpresa.fecha_inicio = data.fecha_inicio
      newPlanEmpresa.id_empresa = data.id_empresa
      newPlanEmpresa.id_plan = data.id_plan

      const res =await this.planEmpresaRepository.save(newPlanEmpresa)

      return {
        ok: true,
        statusCode: 200,
        message: "plan created successfully",
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }
}
