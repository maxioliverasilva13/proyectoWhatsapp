import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTiposervicioDto } from './dto/create-tiposervicio.dto';
import { UpdateTiposervicioDto } from './dto/update-tiposervicio.dto';
import { Tiposervicio } from './entities/tiposervicio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TiposervicioService {
  constructor(
    @InjectRepository(Tiposervicio)
    private productoRepository: Repository<Tiposervicio>) { }

  async create(createTiposervicioDto: CreateTiposervicioDto) {
    return 'This action adds a new tiposervicio';
  }

  async findAll() {
    try {
      const allServices = await this.productoRepository.find()

      return {
        ok:true,
        statusCode:200,
        data: allServices
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener los tipos de servicio',
        error: 'Bad Request',
      });
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} tiposervicio`;
  }

  update(id: number, updateTiposervicioDto: UpdateTiposervicioDto) {
    return `This action updates a #${id} tiposervicio`;
  }

  remove(id: number) {
    return `This action removes a #${id} tiposervicio`;
  }
}
