import { Injectable } from '@nestjs/common';
import { CreateCambioestadopedidoDto } from './dto/create-cambioestadopedido.dto';
import { UpdateCambioestadopedidoDto } from './dto/update-cambioestadopedido.dto';

@Injectable()
export class CambioestadopedidoService {
  create(createCambioestadopedidoDto: CreateCambioestadopedidoDto) {
    return 'This action adds a new cambioestadopedido';
  }

  findAll() {
    return `This action returns all cambioestadopedido`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cambioestadopedido`;
  }

  update(id: number, updateCambioestadopedidoDto: UpdateCambioestadopedidoDto) {
    return `This action updates a #${id} cambioestadopedido`;
  }

  remove(id: number) {
    return `This action removes a #${id} cambioestadopedido`;
  }
}
