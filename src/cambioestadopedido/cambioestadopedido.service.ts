import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCambioestadopedidoDto } from './dto/create-cambioestadopedido.dto';
import { UpdateCambioestadopedidoDto } from './dto/update-cambioestadopedido.dto';
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Cambioestadopedido } from './entities/cambioestadopedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Injectable()
export class CambioestadopedidoService {

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    @InjectRepository(Cambioestadopedido)
    private cambioEstadoRepository: Repository<Cambioestadopedido>,
    @InjectRepository(Usuario)
    private userRepository: Repository<Usuario>
  ) { }


  async create(createCambioestadopedidoDto: CreateCambioestadopedidoDto) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({ where: { id: createCambioestadopedidoDto.pedidoId } })
      if (pedidoExist) {
        throw new BadRequestException("There is no order with that ID")
      }
      const estadoExist = await this.estadoRepository.findOne({ where: { id: createCambioestadopedidoDto.estadoId } })
      if (estadoExist) {
        throw new BadRequestException("There is no status with that ID")
      }
      const userExist = await this.userRepository.findOne({ where: { id: createCambioestadopedidoDto.id_user } })
      if (userExist) {
        throw new BadRequestException("There is no user with that ID")
      }

      const newStatusOrder = await this.cambioEstadoRepository.create({
        estado: estadoExist,
        id_user: userExist.id.toString(),
        pedido: pedidoExist,
      })

      await this.cambioEstadoRepository.save(newStatusOrder)

      pedidoExist.estado = estadoExist

      return {
        ok: true,
        message: "Status order created succesfully"
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
