import { Injectable } from '@nestjs/common';
import { CreateTiposervicioDto } from './dto/create-tiposervicio.dto';
import { UpdateTiposervicioDto } from './dto/update-tiposervicio.dto';

@Injectable()
export class TiposervicioService {
  create(createTiposervicioDto: CreateTiposervicioDto) {
    return 'This action adds a new tiposervicio';
  }

  findAll() {
    return `This action returns all tiposervicio`;
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
