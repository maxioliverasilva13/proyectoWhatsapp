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
import { Infoline } from 'src/infoline/entities/infoline.entity';
import getCurrentDate from 'src/utils/getCurrentDate';

@Injectable()
export class PedidoService {
  private tipoServicioRepository: Repository<Tiposervicio>
  private clienteRepository: Repository<Cliente>
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
        where: { tipo: createPedidoDto.empresaType },
      });

      if (!estado) {
        throw new BadRequestException('No existe un estado con ese id');
      }

      if (!tipoServicio) {
        throw new BadRequestException('No existe un tipo de servicio con ese id');
      }

      const crearNuevoPedido = async (products) => {
        let total = 0;
        const infoLineToJson = JSON.stringify(createPedidoDto.infoLinesJson);
      
        const newPedido = new Pedido();
        newPedido.confirmado = createPedidoDto.confirmado;
        newPedido.cliente_id = createPedidoDto.clienteId;
        newPedido.estado = estado;
        newPedido.tipo_servicio_id = tipoServicio.id;
        newPedido.fecha =
          createPedidoDto.empresaType === "RESERVA"
            ? createPedidoDto.fecha || products[0].fecha
            : getCurrentDate();
        newPedido.infoLinesJson = infoLineToJson;
        newPedido.detalle_pedido = createPedidoDto?.detalles ?? "";
      
        const savedPedido = await this.pedidoRepository.save(newPedido);
        const productIds = products.map((product) => product.productoId);
        const existingProducts = await this.productoRespitory.findByIds(productIds);
      
        try {
          await Promise.all(
            products.map(async (product) => {
              const productExist = existingProducts.find(
                (p) => p.id === product.productoId
              );
      
              if (!productExist) {
                throw new Error(`Producto con ID ${product.productoId} no encontrado`);
              }
      
              total += productExist.precio * product.cantidad;
      
              // Crear producto en el pedido
              await this.productoPedidoService.create({
                cantidad: product.cantidad,
                productoId: product.productoId,
                pedidoId: savedPedido.id,
                detalle: product.detalle,
              });
            })
          );
      
          console.log("Productos creados correctamente");
        } catch (error) {
          console.error("Error al crear productos:", error);
        }
      
        // Crear chat y mensajes
        try {
          const { data } = await this.chatServices.create({ pedidoId: savedPedido.id });
      
          await Promise.all(
            createPedidoDto.messages.map((message) =>
              this.mensajesService.create({
                chat: data.id,
                isClient: message.isClient,
                mensaje: message.text,
              })
            )
          );
      
          console.log("Mensajes creados correctamente");
        } catch (error) {
          console.error("Error al crear chat o mensajes:", error);
        }
      
        // Enviar datos al frontend
        const formatToSendFrontend = {
          clientName: createPedidoDto.clientName,
          direccion:
            createPedidoDto.infoLinesJson.direccion || "No hay direccion",
          numberSender: createPedidoDto.numberSender,
          total,
          orderId: savedPedido.id,
          fecha: savedPedido.fecha
        };
      
        this.webSocketService.sendOrder(formatToSendFrontend);
        return formatToSendFrontend;
      };
      
      // Crear pedidos según el tipo de servicio
      if (tipoServicio.tipo === "RESERVA") {
        await Promise.all(
          createPedidoDto.products.map((product) => crearNuevoPedido([product]))
        );
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
      const pedidoExist = await this.pedidoRepository.findOne({ where: { id: id }, relations: ['cambioEstados', 'chat', 'pedidosprod'] })
      if (!pedidoExist) {
        throw new BadRequestException("No existe un pedido con esse id")
      }
      const getClient = await this.clienteRepository.findOne({ where: { id: pedidoExist.cliente_id } })
      let total = 0;
      let estimateTime = 0;
      const pedidosProdFormated = await Promise.all(
        pedidoExist.pedidosprod.map(async (data) => {
          const productoInfo = await this.productoRespitory.findOne({ where: { id: data.productoId } });
          total += productoInfo.precio * data.cantidad
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
        ok: true,
        statusCode: 200,
        data: {
          client: {
            name: getClient.nombre,
            phone: getClient.telefono,
            id: getClient.id
          },
          products: pedidosProdFormated,
          chatId: pedidoExist.chat,
          date: pedidoExist.fecha,
          confirm: pedidoExist.confirmado,
          id: pedidoExist.id,
          estimateTime,
          total,
          infoLines: JSON.parse(pedidoExist.infoLinesJson)
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

  async findOrders(filter: 'all' | 'pending' | 'finished') {
    try {
      const whereCondition: any = { available: true };

      if (filter === 'pending') {
        whereCondition.confirmado = false;
      } else if (filter === 'finished') {
        whereCondition.confirmado = true;
      }

      const pedidos = await this.pedidoRepository.find({
        where: whereCondition,
        relations: ['pedidosprod', 'pedidosprod.producto'],
      });

      const clienteIds = pedidos.map((pedido) => pedido.cliente_id);
      const clientes = await this.clienteRepository.findByIds(clienteIds);

      const clienteMap = new Map(clientes.map((cliente) => [cliente.id, cliente]));

      const pedidosFinal = pedidos.map((pedido) => {
        const infoLinesJson = JSON.parse(pedido.infoLinesJson || '{}');
        const direcciones = infoLinesJson.direccion || 'No hay direccion';
        let total = 0;

        pedido.pedidosprod.forEach((producto) => {
          total += producto.producto.precio * producto.cantidad;
        });

        const clienteData = clienteMap.get(pedido.cliente_id);

        return {
          clientName: clienteData?.nombre || 'Desconocido',
          direccion: direcciones,
          numberSender: clienteData?.telefono || 'N/A',
          total,
          orderId: pedido.id,
          date: pedido.fecha,
        };
      });

      return {
        ok: true,
        statusCode: 200,
        data: pedidosFinal,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener los pedidos',
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
