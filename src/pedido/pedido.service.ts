import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { ProductopedidoService } from 'src/productopedido/productopedido.service';
import { Producto } from 'src/producto/entities/producto.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { ChatService } from 'src/chat/chat.service';
import { MensajeService } from 'src/mensaje/mensaje.service';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { Cambioestadopedido } from 'src/cambioestadopedido/entities/cambioestadopedido.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { Cliente } from 'src/cliente/entities/cliente.entity';

@Injectable()
export class PedidoService {
  private tipoServicioRepository: Repository<Tiposervicio>
  private clienteRepository : Repository<Cliente>
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    @InjectRepository(Cambioestadopedido)
    private cambioEstadoRepository: Repository<Cambioestadopedido>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(ProductoPedido)
    private productoPedidoRepository: Repository<ProductoPedido>,
    private readonly productoPedidoService: ProductopedidoService,
    @InjectRepository(Producto)
    private readonly productoRespitory: Repository<Producto>,
    private readonly chatServices: ChatService,
    private readonly mensajesService: MensajeService,
    private readonly webSocketService: WebsocketGateway
  ) { }

  async onModuleInit() {
    const globalConnection = await handleGetGlobalConnection();
    this.tipoServicioRepository = globalConnection.getRepository(Tiposervicio);
    this.clienteRepository = globalConnection.getRepository(Cliente)
  }

  async create(createPedidoDto: CreatePedidoDto) {
    try {
      const estado = await this.estadoRepository.findOne({
        where: { id: createPedidoDto.estadoId },
      });

      const tipoServicio = await this.tipoServicioRepository.findOne({
        where: { id: createPedidoDto.tipo_servicioId },
      });

      if (!estado) {
        throw new BadRequestException('No existe un estado con ese id');
      }

      if (!tipoServicio) {
        throw new BadRequestException('No existe un tipo de servicio con ese id');
      }
      const crearNuevoPedido = async (products) => {

        const newPedido = new Pedido();
        newPedido.confirmado = createPedidoDto.confirmado;
        newPedido.cliente_id = createPedidoDto.clienteId;
        newPedido.estado = estado;
        newPedido.tipo_servicio_id = createPedidoDto.tipo_servicioId;
        newPedido.infoLinesJson = JSON.stringify(products);
        newPedido.fecha = createPedidoDto.empresaType === "RESERVA" ? products[0].fecha : new Date()

        const savedPedido = await this.pedidoRepository.save(newPedido);

        try {
          await Promise.all(
            products.map((product) =>
              this.productoPedidoService.create({
                cantidad: product.cantidad,
                productoId: product.productoId,
                pedidoId: savedPedido.id,
                detalle: product.detalle,
              })
            )
          );
          console.log('productos creados correctamente');
        } catch (error) {
          console.error('Error al crear productos:', error);
        }

        try {

          const { data } = await this.chatServices.create({ pedidoId: savedPedido.id });
          console.log('nuevo chat creado');

          try {
            await Promise.all(
              createPedidoDto.messages.map((message) =>
                this.mensajesService.create({
                  chat: data.id,
                  isClient: message.isClient,
                  mensaje: message.text,
                })
              )
            );
            console.log('mensajes creados correctamente');
          } catch (error) {
            console.error('Error al crear mensajes:', error);
          }
        } catch (error) {
          console.error('Error al crear chat:', error);
        }

        this.webSocketService.sendOrder(savedPedido)
        return savedPedido;
      };

      if (tipoServicio.tipo === 'RESERVA') {
        if (createPedidoDto.products.length > 1) {
          for (const product of createPedidoDto.products) {
            await crearNuevoPedido([product]);
          }
        } else {
          await crearNuevoPedido(createPedidoDto.products);
        }
      } else {
        await crearNuevoPedido(createPedidoDto.products);
      }


      return {
        statusCode: 200,
        ok: true,
        message: 'Pedido creado exitosamente',
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }


  async consultarHorario(hora, producto) {
    const allServices = await this.pedidoRepository.find({
      relations: ['pedidosprod', 'pedidosprod.producto'],
    });

    let duracionMinutos;
    let isAviable = true;

    const productoBD = await this.productoRespitory.findOne({ where: { id: producto.productoId } })
    duracionMinutos += productoBD.plazoDuracionEstimadoMinutos;

    const horaFormated = new Date(hora);
    const horaFinSolicitadad = new Date(horaFormated)
    horaFinSolicitadad.setMinutes(horaFinSolicitadad.getMinutes() + duracionMinutos)

    for (const service of allServices) {
      const fechaInicial = new Date(service.fecha);
      for (const pedidoProd of service.pedidosprod) {
        const fechaFinal = new Date(fechaInicial);
        fechaFinal.setMinutes(fechaFinal.getMinutes() + pedidoProd.producto.plazoDuracionEstimadoMinutos);
        if (
          (horaFormated < fechaFinal && horaFinSolicitadad > fechaInicial) ||
          (horaFormated >= fechaInicial && horaFormated < fechaFinal)
        ) {
          isAviable = false;
          break;
        }
      };
    };

    return {
      "ok": isAviable ? true : false,
      "isAviable": isAviable
    }
  }

  async getDetailsOfOrder(id: number) {
    try {
      console.log(id);
      
      const pedidoExist = await this.pedidoRepository.findOne({where:{id: id}, relations: ['cambioEstados', 'chat', 'pedidosprod'] })
      if(!pedidoExist) {
        throw new BadRequestException("No existe un pedido con esse id")
      }
      const getClient  = await this.clienteRepository.findOne({where:{id: pedidoExist.cliente_id}})
      let total = 0;
      let estimateTime = 0; 
      const pedidosProdFormated = await Promise.all(
        pedidoExist.pedidosprod.map(async (data) => {
          const productoInfo = await this.productoRespitory.findOne({ where: { id: data.productoId } });
          total += productoInfo.precio
          estimateTime += productoInfo.plazoDuracionEstimadoMinutos

          return {
            productoInfo,
            pedidoId: data.pedidoId,
            detalle: data.detalle,
            cantidad: data.cantidad,
          };
        }),
      );

      return {
        ok:true,
        statusCode:200,
        data:{
          client: {
            name: getClient.nombre,
            phone: getClient.telefono,
            id: getClient.id
          },
          products : pedidosProdFormated,
          chatId: pedidoExist.chat,
          date: pedidoExist.fecha,
          confirm : pedidoExist.confirmado,
          id: pedidoExist.id,
          estimateTime,
          total
        }
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  async findAllPedning(empresaType) {
    try {
      const pedidos = await this.pedidoRepository.find({ where: { confirmado: false,  available:true } })

      return {
        ok: true,
        statusCode: 200,
        data: pedidos
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  async findAllFinish(empresaType) {
    try {
      const pedidos = await this.pedidoRepository.find({ where: { confirmado: true, available:true } })

      return {
        ok: true,
        statusCode: 200,
        data: pedidos
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  async confirmOrder(id) {
    try {
      const pedido = await this.pedidoRepository.findOne({ where: { id } })

      if (!pedido) {
        throw new BadRequestException('There is no order with that ID')
      }

      pedido.confirmado = true

      await this.pedidoRepository.save(pedido)

      return {
        ok: true,
        statusCode: 200,
        data: pedido
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} pedido 1`;
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    return `This action updates a #${id} pedido 2`;
  }

  async remove(id: number) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({
        where: { id: id },
        relations: ['cambioEstados', 'chat', 'chat.mensajes', 'pedidosprod'],
      });

      pedidoExist.available = false

      await this.pedidoRepository.save(pedidoExist)

      return {
        ok: true,
        message: 'Order deleted successfully',
        statusCode: 200,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error while deleting the order',
        error: 'Bad Request',
      });
    }
  }

}
