import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>
  ) { }

  async create(createPlanDto: CreatePlanDto) {
    try {
      if (!createPlanDto.costoUSD || !createPlanDto.diasDuracion || !createPlanDto.nombre) {
        throw new BadRequestException('plase enter a valid body')
      }
      const planNuevo = new Plan;
      planNuevo.costoUSD = createPlanDto.costoUSD
      planNuevo.diasDuracion = createPlanDto.diasDuracion
      planNuevo.nombre = createPlanDto.nombre
      planNuevo.adventages = createPlanDto.adventages
      if(createPlanDto.mostPopular) {
        planNuevo.mostPoppular = createPlanDto.mostPopular
      }

      await this.planRepository.save(planNuevo);

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

  async findAll() {
    try {
      return this.planRepository.find()
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async findOne(id: number) {
    try {
      const plan = await this.planRepository.findOneBy({ id });
      if (!plan) {
        throw new BadRequestException(`Plan with ID ${id} not found`);
      }
      return plan;
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error fetching the plan',
        error: 'Bad Request',
      });
    }
  }

  async update(id: number, updatePlanDto: UpdatePlanDto) {
    try {
      const plan = await this.planRepository.findOneBy({ id });
      if (!plan) {
        throw new BadRequestException(`Plan with ID ${id} not found`);
      }

      Object.assign(plan, updatePlanDto);
      await this.planRepository.save(plan);

      return {
        ok: true,
        statusCode: 200,
        message: `Plan with ID ${id} updated successfully`,
        updatedPlan: plan,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error updating the plan',
        error: 'Bad Request',
      });
    }
  }

  async remove(id: number) {
    try {
      const plan = await this.planRepository.findOneBy({ id });
      if (!plan) {
        throw new BadRequestException(`Plan with ID ${id} not found`);
      }

      await this.planRepository.delete(id);

      return {
        ok: true,
        statusCode: 200,
        message: `Plan with ID ${id} deleted successfully`,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error deleting the plan',
        error: 'Bad Request',
      });
    }
  }
}

