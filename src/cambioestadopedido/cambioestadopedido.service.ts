import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCambioestadopedidoDto } from './dto/create-cambioestadopedido.dto';
import { UpdateCambioestadopedidoDto } from './dto/update-cambioestadopedido.dto';
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Cambioestadopedido } from './entities/cambioestadopedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { TIPO_SERVICIO_RESERVA_ID } from 'src/database/seeders/app/tipopedido.seed';

@Injectable()
export class CambioestadopedidoService {

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    @InjectRepository(Cambioestadopedido)
    private cambioEstadoRepository: Repository<Cambioestadopedido>,
    @InjectQueue(`sendMessageChangeStatusOrder-${process.env.SUBDOMAIN}`) private readonly messageQueue: Queue,
    private readonly webSocketService : WebsocketGateway

  ) { }


  async create(createCambioestadopedidoDto: CreateCambioestadopedidoDto) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({ where: { id: createCambioestadopedidoDto.pedidoId } })
      if (!pedidoExist) {
        throw new BadRequestException("There is no order with that ID")
      }
      const estadoExist = await this.estadoRepository.findOne({ where: { id: createCambioestadopedidoDto.estadoId } })
      if (!estadoExist) {
        throw new BadRequestException("There is no status with that ID")
      }

      const newStatusOrder = await this.cambioEstadoRepository.create({
        estado: estadoExist,
        id_user: createCambioestadopedidoDto.id_user,
        pedido: pedidoExist,
        createdAt: new Date()
      })

      await this.messageQueue.add('send', {
        message: estadoExist.mensaje || `Hemos echo el cambio de estado de su ${pedidoExist?.tipo_servicio_id === TIPO_SERVICIO_RESERVA_ID ? "Reserva" : "Orden"} de ${(pedidoExist?.estado?.nombre) ?? "Creado"} a ${estadoExist?.nombre}`,
        chatId: pedidoExist.chatIdWhatsapp
      }, {
        priority: 0,
        attempts: 5,
      });

      await this.cambioEstadoRepository.save(newStatusOrder)

      pedidoExist.estado = estadoExist

      await this.pedidoRepository.save(pedidoExist)

      await this.webSocketService.emitNotificationChangeStatuss(newStatusOrder)

      return {
        ok: true,
        message: "Cambio de estado realizado exitosamente",
        data: newStatusOrder
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al enviar el mensaje al usuario',
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
