import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, MoreThan, Repository } from 'typeorm';
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
import getCurrentDate from 'src/utils/getCurrentDate';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { EstadoDefectoIds } from 'src/enums/estadoDefecto';
import * as moment from 'moment-timezone';

const LOCALE_TIMEZONE = 'America/Montevideo';
@Injectable()
export class PedidoService implements OnModuleDestroy {
  private tipoServicioRepository: Repository<Tiposervicio>;
  private clienteRepository: Repository<Cliente>;
  private empresaRepository: Repository<Empresa>;
  private globalConnection: DataSource;

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
    private readonly webSocketService: WebsocketGateway,
  ) { }

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.tipoServicioRepository =
      this.globalConnection.getRepository(Tiposervicio);
    this.clienteRepository = this.globalConnection.getRepository(Cliente);
    this.empresaRepository = this.globalConnection.getRepository(Empresa);
  }

  async cancel(pedidoId: any) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });
    if (pedido) {
      pedido.finalizado = true;
      const statusFinalizador = await this.estadoRepository.findOne({
        where: { finalizador: true },
      });
      if (statusFinalizador) {
        pedido.estado = statusFinalizador;
      }
      await this.pedidoRepository.save(pedido);
    }
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  async getMyOrders(client_id: any) {
    if (client_id) {
      const allPedidos = (
        await this.pedidoRepository.find({
          where: { cliente_id: client_id, available: true, finalizado: false },
          relations: ['pedidosprod', 'pedidosprod.producto', 'estado', 'cambioEstados'],
        })
      ).map((pedido) => {
        return pedido;
      });
      return JSON.stringify(allPedidos);
    } else {
      return 'No hay pedidos recientes';
    }
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
        throw new BadRequestException(
          'No existe un tipo de servicio con ese id',
        );
      }

      let messageFinal = createPedidoDto?.messageToUser
        ? createPedidoDto?.messageToUser
        : 'Gracias por realizar su orden, aqui estan los detalles de la misma:\n\nProductos:\n';
      let globalTotal = 0;

      const crearNuevoPedido = async (products) => {
        let total = 0;
        const infoLineToJson = JSON.stringify(createPedidoDto.infoLinesJson);

        const newPedido = new Pedido();
        newPedido.confirmado = createPedidoDto.confirmado || false;
        newPedido.cliente_id = createPedidoDto.clienteId;
        newPedido.estado = estado;
        newPedido.tipo_servicio_id = tipoServicio.id;
        newPedido.fecha =
          createPedidoDto.empresaType === 'RESERVA'
            ? createPedidoDto.fecha || products[0].fecha
            : getCurrentDate();
        newPedido.infoLinesJson = infoLineToJson;
        newPedido.detalle_pedido = createPedidoDto?.detalles ?? '';

        const savedPedido = await this.pedidoRepository.save(newPedido);
        const productIds = products.map((product) => product.productoId);
        const existingProducts =
          await this.productoRespitory.findByIds(productIds);
        try {
          await Promise.all(
            products.map(async (product) => {
              let producto = '';

              const productExist = existingProducts.find(
                (p) => p.id === product.productoId,
              );
              if (!productExist) {
                throw new Error(
                  `Producto con ID ${product.productoId} no encontrado`,
                );
              }

              producto +=
                '\n--Nombre: ' + (productExist.nombre ?? 'No hay nombre');
              producto += '\n--Precio: ' + (productExist.precio ?? 0);
              producto += '\n--Cantidad: ' + product.cantidad;
              producto +=
                '\n--Detalle: ' + (product.detalle ?? 'No hay detalle');
              Object.keys(createPedidoDto.infoLinesJson).forEach((key) => {
                const value = createPedidoDto.infoLinesJson[key];
                producto += `\n--${key}: ${value}`;
              });

              total += productExist.precio * product.cantidad;
              producto += '\nTotal: ' + total;

              await this.productoPedidoService.create({
                cantidad: product.cantidad,
                productoId: product.productoId,
                pedidoId: savedPedido.id,
                detalle: product.detalle,
              });

              messageFinal += '\n' + producto + '\n';
            }),
          );

        } catch (error) {
          console.error('Error al crear productos:', error);
        }

        try {
          const { data } = await this.chatServices.create({
            pedidoId: savedPedido.id,
          });

          await Promise.all(
            createPedidoDto.messages.map((message) =>
              this.mensajesService.create({
                chat: data.id,
                isClient: message.isClient,
                mensaje: message.text,
              }),
            ),
          );

          console.log('Mensajes creados correctamente');
        } catch (error) {
          console.error('Error al crear chat o mensajes:', error);
        }

        const formatToSendFrontend = {
          clientName: createPedidoDto.clientName,
          direccion:
            createPedidoDto.infoLinesJson.direccion || 'No hay direccion',
          numberSender: createPedidoDto.numberSender,
          total,
          orderId: savedPedido.id,
          fecha: savedPedido.fecha,
          status: savedPedido.confirmado,
        };

        globalTotal += total;
        this.webSocketService.sendOrder(formatToSendFrontend);
        return formatToSendFrontend;
      };

      if (tipoServicio.tipo === 'RESERVA') {
        await Promise.all(
          createPedidoDto.products.map((product) =>
            crearNuevoPedido([product]),
          ),
        );
      } else {
        await crearNuevoPedido(createPedidoDto.products);
      }

      return {
        statusCode: 200,
        ok: true,
        message: 'Pedido creado exitosamente',
        messageToUser: createPedidoDto?.messageToUser
          ? createPedidoDto?.messageToUser
          : messageFinal + '\n\nTotal:' + globalTotal,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el pedido',
        error: 'Bad Request',
      });
    }
  }

  async consultarHorario(hora, producto, timeZone, empresaId) {
    const empresa = await this.empresaRepository.findOne({
      where: { id: empresaId },
    });

    const allServices = await this.pedidoRepository.find({
      relations: ['pedidosprod', 'pedidosprod.producto'],
    });

    let isAviable = true;

    const intervaloEmpresa = empresa.intervaloTiempoCalendario;

    const horaFormated = moment.tz(hora, timeZone);
    const horaFinSolicitadad = moment
      .tz(horaFormated, timeZone)
      .add(intervaloEmpresa, 'minutes');

    for (const service of allServices) {
      const fechaInicial = moment.tz(service.fecha, timeZone);

      const fechaFinal = moment(fechaInicial, timeZone).add(
        intervaloEmpresa,
        'minutes',
      );

      if (
        (horaFormated.isBefore(fechaFinal) &&
          horaFinSolicitadad.isAfter(fechaInicial)) ||
        (horaFormated.isSameOrAfter(fechaInicial) &&
          horaFormated.isBefore(fechaFinal))
      ) {
        isAviable = false;
        break;
      }
    }

    return {
      ok: isAviable,
      isAviable: isAviable,
    };
  }

  async getDetailsOfOrder(id: number) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({
        where: { id: id },
        relations: ['cambioEstados', 'chat', 'pedidosprod'],
      });
      if (!pedidoExist) {
        throw new BadRequestException('No existe un pedido con esse id');
      }
      const getClient = await this.clienteRepository.findOne({
        where: { id: pedidoExist.cliente_id },
      });
      let total = 0;
      let estimateTime = 0;
      const pedidosProdFormated = await Promise.all(
        pedidoExist.pedidosprod.map(async (data) => {
          const productoInfo = await this.productoRespitory.findOne({
            where: { id: data.productoId },
          });
          total += productoInfo.precio * data.cantidad;
          estimateTime += productoInfo.plazoDuracionEstimadoMinutos;

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
            id: getClient.id,
          },
          products: pedidosProdFormated,
          chatId: pedidoExist.chat,
          date: pedidoExist.fecha,
          confirm: pedidoExist.confirmado,
          id: pedidoExist.id,
          estimateTime,
          total,
          infoLines: JSON.parse(pedidoExist.infoLinesJson),
        },
      };
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
      if (!filter) {
        throw new BadRequestException(
          'Please specify what type of order you wish to access',
        );
      }

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

      const clienteMap = new Map(
        clientes.map((cliente) => [cliente.id, cliente]),
      );

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
          status: pedido.confirmado,
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

  async getNextDateTimeAvailable(empresaId: number, timeZone): Promise<any> {
    try {
      const empresaInfo = await this.empresaRepository.findOne({
        where: { id: empresaId },
      });

      if (!empresaInfo) {
        throw new Error('Empresa no encontrada');
      }

      const {
        hora_apertura: horaAperturaEmpresa,
        hora_cierre: horaCierreEmpresa,
        intervaloTiempoCalendario,
      } = empresaInfo;

      if (!horaAperturaEmpresa || !horaCierreEmpresa) {
        throw new Error('La empresa no tiene horarios configurados.');
      }

      const horaActual = moment().tz(timeZone);

      const [aperturaHora, aperturaMinuto] = horaAperturaEmpresa
        .split(':')
        .map(Number);
      const apertura = moment(horaActual)
        .tz(timeZone)
        .hour(aperturaHora)
        .minute(aperturaMinuto)
        .second(0)
        .millisecond(0);

      const [cierreHora, cierreMinuto] = horaCierreEmpresa
        .split(':')
        .map(Number);
      const cierre = moment(horaActual)
        .tz(timeZone)
        .hour(cierreHora)
        .minute(cierreMinuto)
        .second(0)
        .millisecond(0);

      const minutosActuales = horaActual.minutes();
      const minutosRedondeados =
        Math.ceil(minutosActuales / intervaloTiempoCalendario) *
        intervaloTiempoCalendario;
      let proximoDisponible = moment(horaActual)
        .tz(timeZone)
        .minute(minutosRedondeados)
        .second(0)
        .millisecond(0);

      console.log('proximoDisponible xd1', proximoDisponible);

      if (horaActual.isSameOrAfter(cierre)) {
        apertura.add(1, 'day');
        cierre.add(1, 'day');
        proximoDisponible = apertura.clone().tz(timeZone);
      }

      while (true) {
        console.log(
          `Verificando disponibilidad para el día: ${apertura.format('YYYY-MM-DD')}`,
        );

        const allPedidos = await this.pedidoRepository
          .createQueryBuilder('pedido')
          .where('pedido.fecha >= :apertura AND pedido.fecha < :cierre', {
            apertura: apertura.format('YYYY-MM-DD HH:mm:ss+00'),
            cierre: cierre.format('YYYY-MM-DD HH:mm:ss+00'),
          })
          .andWhere('pedido.estado != :estadoCancelado', {
            estadoCancelado: EstadoDefectoIds.CANCELADO,
          })
          .andWhere('pedido.fecha > :horaActual', {
            horaActual: horaActual.format('YYYY-MM-DD HH:mm:ss+00'),
          })
          .getMany();

        const pedidosActivos = allPedidos;

        const intervalosOcupados = pedidosActivos.map((pedido) => {
          const inicio = moment(pedido.fecha).tz(timeZone);
          const fin = inicio
            .clone()
            .tz(timeZone)
            .add(intervaloTiempoCalendario, 'minutes');
          return { inicio, fin };
        });

        intervalosOcupados.sort(
          (a, b) => a.inicio.valueOf() - b.inicio.valueOf(),
        );

        console.log(
          'Intervalos ocupados:',
          intervalosOcupados.map((i) => ({
            inicio: i.inicio.format('HH:mm'),
            fin: i.fin.format('HH:mm'),
          })),
        );

        let encontradoHueco = false;

        if (
          intervalosOcupados?.length === 0 &&
          pedidosActivos?.length === 0 &&
          horaActual.isAfter(cierre)
        ) {
          proximoDisponible = apertura.clone().tz(timeZone);
        }
        console.log('intervalosOcupados', intervalosOcupados);

        for (let i = 0; i <= intervalosOcupados.length - 1; i++) {
          const actual = intervalosOcupados[i];
          const siguiente = intervalosOcupados[i + 1];
          console.log('comparando', intervalosOcupados[i]);
          console.log('siguiente', siguiente);
          console.log('proximoDisponible', proximoDisponible);

          if (!actual) {
            if (proximoDisponible.isBefore(cierre)) {
              console.log('if 1');
              encontradoHueco = true;
              break;
            }
          } else if (proximoDisponible.isBefore(actual.inicio)) {
            console.log('if 2');
            encontradoHueco = true;
            break;
          } else if (siguiente) {
            console.log('if 3');
            const finActual = actual.fin.clone().tz(timeZone);
            if (finActual.isBefore(siguiente.inicio)) {
              console.log('if 4');
              proximoDisponible = finActual;
              encontradoHueco = true;
              break;
            } else {
              proximoDisponible = actual.fin.clone().tz(timeZone);
            }
          } else {
            console.log('if 5');
            encontradoHueco = true;
            proximoDisponible = actual.fin.clone().tz(timeZone);

            if (proximoDisponible.isSameOrAfter(cierre)) {
              console.log('add');
              encontradoHueco = false;
            }
            console.log('if 5 desp', proximoDisponible);
          }
        }

        if (encontradoHueco && proximoDisponible.isBefore(cierre)) {
          console.log('acap 3');
          return proximoDisponible.toISOString();
        } else if (
          intervalosOcupados?.length === 0 &&
          proximoDisponible.isBefore(cierre)
        ) {
          if (proximoDisponible.isSameOrAfter(cierre)) {
            console.log('acap 1');
            encontradoHueco = false;
          } else {
            console.log('acap 2');
            return proximoDisponible.toISOString();
          }
        }

        console.log('Pasando al siguiente día');
        apertura.add(1, 'day');
        cierre.add(1, 'day');
        proximoDisponible = apertura.clone().tz(timeZone);

        if (apertura.diff(horaActual, 'days') > 30) {
          throw new Error(
            'No se encontró disponibilidad en los próximos 30 días',
          );
        }
      }
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener disponibilidad',
        error: 'Bad Request',
      });
    }
  }

  async getOrdersForCalendar(dateTime: string, timeZone: string) {
    try {
      const now = getCurrentDate();
      const filterDate = moment(dateTime, 'YYYY-MM-DD').startOf('day');

      const filterDateStart = filterDate.startOf('day').toDate();
      const filterDateEnd = filterDate.endOf('day').toDate();

      const pedidos = await this.pedidoRepository.find({
        where: {
          available: true,
          fecha: Between(filterDateStart, filterDateEnd),
        },
        order: {
          fecha: 'DESC',
        },
        relations: ['pedidosprod', 'pedidosprod.producto'],
      });

      const dates = {};
      await Promise.all(
        pedidos.map(async (pedido) => {
          const formattedDate = moment(pedido.fecha).format('YYYY-MM-DD');
          const clientData = await this.clienteRepository.findOne({
            where: { id: pedido.cliente_id },
          });
          const pedidoProd = pedido.pedidosprod[0];

          const pedidoDate = moment.tz(
            JSON.stringify(pedido.fecha),
            'YYYY-MM-DD HH:mm:ss',
            timeZone,
          );
          const nowMoment = moment.tz(now, 'YYYY-MM-DD HH:mm:ss', timeZone);

          const isOlder = pedidoDate.isAfter(nowMoment);

          const formatPedidoResponse = {
            clientName: clientData?.nombre || 'Desconocido',
            numberSender: clientData?.telefono || 'N/A',
            orderId: pedido.id,
            productName: pedidoProd?.producto?.nombre,
            total: pedidoProd?.cantidad * pedidoProd?.producto.precio,
            date: isOlder ? pedidoDate.format('LT') : pedidoDate.fromNow(),
            status: pedido.confirmado,
            product: pedidoProd.producto.nombre,
          };

          if (formattedDate in dates) {
            dates[formattedDate].push(formatPedidoResponse);
          } else {
            dates[formattedDate] = [formatPedidoResponse];
          }
        }),
      );

      return {
        data: dates,
        statusCode: 200,
        ok: true,
      };
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
      const pedido = await this.pedidoRepository.findOne({ where: { id } });

      if (!pedido) {
        throw new BadRequestException('There is no order with that ID');
      }

      pedido.confirmado = true;

      await this.pedidoRepository.save(pedido);

      return {
        ok: true,
        statusCode: 200,
        data: pedido,
      };
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

  async update(id: number, updatePedidoDto: UpdatePedidoDto) {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });

    if (!pedido) {
      throw new Error(`Pedido con id ${id} no encontrado`);
    }

    for (const [key, value] of Object.entries(updatePedidoDto)) {
      if (key === 'infoLinesJson') {
        let currentInfoLines = {};
        try {
          currentInfoLines = pedido.infoLinesJson
            ? JSON.parse(pedido.infoLinesJson)
            : {};
        } catch (e) {
          console.error('Error al parsear infoLinesJson actual:', e);
        }

        const mergedInfo = {
          ...currentInfoLines,
          ...value,
        };

        pedido.infoLinesJson = JSON.stringify(mergedInfo);
      } else {
        if (key in pedido) {
          (pedido as any)[key] = value;
        }
      }
    }

    await this.pedidoRepository.save(pedido);
    return pedido;
  }


  async remove(id: number) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({
        where: { id: id },
        relations: ['cambioEstados', 'chat', 'chat.mensajes', 'pedidosprod'],
      });

      pedidoExist.available = false;

      await this.pedidoRepository.save(pedidoExist);

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

  async getOrdersOfTheDay(date: string, timeZone: string) {
    try {
      const startDay = moment.tz(date, timeZone).startOf('day').toDate();
      const endDay = moment.tz(date, timeZone).endOf('day').toDate();

      const orderCount = await this.pedidoRepository.count({
        where: { fecha: Between(startDay, endDay) },
      });

      return {
        ok: true,
        ordersDay: orderCount,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error getting orders of the dat',
        error: 'Bad Request',
      });
    }
  }
  async getMoneyOfTheDay(date: string, timeZone: string) {
    try {
      const startDay = moment.tz(date, timeZone).startOf('day').toDate();
      const endDay = moment.tz(date, timeZone).endOf('day').toDate();

      const ordersDay = await this.pedidoRepository.find({
        where: { fecha: Between(startDay, endDay) },
        relations: ['pedidosprod', 'pedidosprod.producto'],
      });
      console.log();
      console.log(ordersDay.length);

      let ganancia = 0;

      ordersDay.map((order) => {
        if (order.pedidosprod.length > 0) {
          console.log('entro');

          order.pedidosprod.map((pedidoProd) => {
            ganancia += pedidoProd.cantidad * pedidoProd.producto.precio;
          });
        }
      });

      return {
        ok: true,
        ganancia,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error getting diary revenue',
        error: 'Bad Request',
      });
    }
  }

  async getLastThreeOrders() {
    try {
      const lastOrders = await this.pedidoRepository.find({
        order: { id: 'DESC' },
        take: 3,
        relations: ['pedidosprod', 'pedidosprod.producto']
      });

      const ordersWithTotal = lastOrders.map((element) => {
        let total = 0;
  
        element.pedidosprod.forEach((pedidoProd) => {
          total += pedidoProd.cantidad * pedidoProd.producto.precio;
        });
  
        return {
          ...element,
          total,
        };
      });

      return {
        ok: true,
        data: ordersWithTotal,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error getting three last orders',
        error: 'Bad Request',
      });
    }
  }

  async getOrdersOfTimePeriods() {
    try {
      const now = moment();

      const periods = {
        weekly: now.clone().startOf('isoWeek'),
        monthly: now.clone().startOf('month'),
        quarterly: now.clone().startOf('quarter'),
        yearly: now.clone().startOf('year'),
      };

      const orders = await this.pedidoRepository.find({
        where: { fecha: MoreThan(periods.yearly.toDate()) },
        relations: ['pedidosprod', 'pedidosprod.producto'],
      });

      const groupedOrders = {
        weekly: orders.filter((order) =>
          moment(order.fecha).isSameOrAfter(periods.weekly),
        ),
        monthly: orders.filter((order) =>
          moment(order.fecha).isSameOrAfter(periods.monthly),
        ),
        quarterly: orders.filter((order) =>
          moment(order.fecha).isSameOrAfter(periods.quarterly),
        ),
        yearly: orders,
      };

      return {
        ok: true,
        weekly: getTotalOfPeriod(groupedOrders.weekly),
        monthly: getTotalOfPeriod(groupedOrders.monthly),
        quarterly: getTotalOfPeriod(groupedOrders.quarterly),
        yearly: getTotalOfPeriod(groupedOrders.yearly),
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error getting orders',
        error: 'Bad Request',
      });
    }
  }
}

const getTotalOfPeriod = (orders) => {
  let total = 0;
  orders.map((order) => {
    order.pedidosprod.map((pedidoProd) => {
      total += pedidoProd.cantidad * pedidoProd.producto.precio;
    });
  });

  return total;
};
