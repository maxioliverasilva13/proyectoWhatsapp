import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Horario } from './entities/horario.entity';
import { CreateHorarioDto } from './dto/create-horario.dto';

@Injectable()
export class HorarioService {
  constructor(
    @InjectRepository(Horario)
    private horarioRepo: Repository<Horario>,
  ) {}

  async findByDay(dayOfWeek: number): Promise<Horario[]> {
    return this.horarioRepo.find({
      where: { dayOfWeek },
      order: { hora_inicio: 'ASC' },
    });
  }

  async create(
    createDto: CreateHorarioDto,
    isDailyMenu: boolean = false,
  ): Promise<Horario> {
    const { dayOfWeek, hora_inicio, hora_fin } = createDto;

    if (hora_inicio >= hora_fin) {
      throw new BadRequestException(
        'La hora de inicio debe ser menor que la hora de fin.',
      );
    }

    const existentes = await this.horarioRepo.find({
      where: { dayOfWeek, isDailyMenu: isDailyMenu },
    });

    const solapado = existentes.some((horario) => {
      return hora_inicio < horario.hora_fin && horario.hora_inicio < hora_fin;
    });

    if (solapado) {
      throw new BadRequestException(
        `Ya existe un horario que se solapa con el horario ${hora_inicio} - ${hora_fin} en el día ${dayOfWeek}`,
      );
    }

    const horario = this.horarioRepo.create({
      ...createDto,
      isDailyMenu: isDailyMenu,
    });
    return this.horarioRepo.save(horario);
  }

  async updateDailySchedule(id: any, dataDTO: any) {
    const existsSchedule = await this.horarioRepo.findOne({
      where: { id: id },
    });

    if (!existsSchedule) {
      throw new BadRequestException('El producto no existe');
    }
    for (const dato in existsSchedule) {
      if (dataDTO.hasOwnProperty(dato)) {
        existsSchedule[dato] = dataDTO[dato];
      }
    }
    await this.horarioRepo.save(existsSchedule);
  }

  async findAll(dailyMenu: boolean = false): Promise<Horario[]> {
    return this.horarioRepo.find({
      order: { dayOfWeek: 'ASC', hora_inicio: 'ASC' },
      where: { isDailyMenu: dailyMenu },
    });
  }

  async remove(id: number): Promise<void> {
    const horario = await this.horarioRepo.findOne({ where: { id } });

    if (!horario) {
      throw new NotFoundException(`Horario con id ${id} no encontrado`);
    }

    await this.horarioRepo.remove(horario);
  }
}
