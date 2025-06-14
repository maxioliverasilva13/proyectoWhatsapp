import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  In,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { ProductopedidoService } from 'src/productopedido/productopedido.service';
import { Producto } from 'src/producto/entities/producto.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
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
import { log } from 'node:console';
import { Category } from 'src/category/entities/category.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { TIPO_SERVICIO_DELIVERY_ID } from 'src/database/seeders/app/tipopedido.seed';

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
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    @InjectRepository(Cambioestadopedido)
    private cambioEstadoRepository: Repository<Cambioestadopedido>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>,
    private readonly productoPedidoService: ProductopedidoService,
    @InjectRepository(Producto)
    private readonly productoRespitory: Repository<Producto>,
    private readonly webSocketService: WebsocketGateway,
    @InjectRepository(Category)
    private readonly categoryService: Repository<Category>,
    @InjectRepository(ProductoPedido)
    private readonly productoPedidoRepository: Repository<ProductoPedido>,
    @InjectQueue(`sendMessageChangeStatusOrder-${process.env.SUBDOMAIN}`)
    private readonly messageQueue: Queue,
  ) {}

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.tipoServicioRepository =
      this.globalConnection.getRepository(Tiposervicio);
    this.clienteRepository = this.globalConnection.getRepository(Cliente);
    this.empresaRepository = this.globalConnection.getRepository(Empresa);
  }

  async getStatistics(filterType: any) {
    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });
    if (!empresa) {
      throw new BadRequestException('La empresa indicada no existe');
    }
    const now = moment.tz(empresa.timeZone ?? 'America/Montevideo');
    let fromDate: Date;

    switch (filterType) {
      case 'today':
        fromDate = now.clone().startOf('day').toDate();
        break;
      case 'lastWeek':
        fromDate = now.clone().subtract(7, 'days').startOf('day').toDate();
        break;
      case 'lastMonth':
        fromDate = now.clone().subtract(1, 'month').startOf('day').toDate();
        break;
      default:
        fromDate = now.clone().startOf('day').toDate();
        break;
    }

    const pedidos = await this.pedidoRepository.find({
      where: {
        confirmado: true,
        available: true,
        fecha: MoreThanOrEqual(fromDate),
      },
      relations: ['pedidosprod', 'pedidosprod.producto'],
    });

    const orders = pedidos.length;

    const clientIds = new Set<number>();
    let revenue = 0;

    for (const pedido of pedidos) {
      if (pedido.cliente_id) {
        clientIds.add(pedido.cliente_id);
      }

      for (const prod of pedido.pedidosprod || []) {
        const precio = (prod as any)?.producto?.precio || 0;
        const cantidad = (prod as any).cantidad || 1;
        revenue += precio * cantidad;
      }
    }

    return {
      clients: clientIds.size,
      revenue,
      orders,
    };
  }

  async cancel(pedidoId: any) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id: pedidoId },
    });
    if (pedido) {
      pedido.finalizado = true;
      pedido.available = false;
      const statusFinalizador = await this.estadoRepository.findOne({
        where: { finalizador: true },
      });
      if (statusFinalizador) {
        pedido.estado = statusFinalizador;
      }

      const clientId = pedido?.cliente_id;

      const client = await this.clienteRepository.findOne({
        where: { id: clientId },
      });
      if (client) {
        await this.messageQueue.add(
          'send',
          {
            message: `Lamentamos informarte que tu ${pedido?.tipo_servicio_id === TIPO_SERVICIO_DELIVERY_ID ? 'orden' : 'reserva'} número #${pedido?.id} ha sido cancelada por la empresa. Para más información, por favor contáctanos.`,
            chatId: pedido?.chatIdWhatsapp,
          },
          {
            priority: 0,
            attempts: 5,
          },
        );
      }

      await this.pedidoRepository.save(pedido);
    }
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  async getSalesForCategory() {
    try {
      const resultados = await this.productoPedidoRepository
        .createQueryBuilder('pp')
        .leftJoin('pp.pedido', 'pedido')
        .leftJoin('pp.producto', 'producto')
        .leftJoin('producto.category', 'categoria')
        .select('categoria.name', 'categoria')
        .addSelect('COUNT(pp.productoId)', 'cantidadVendida')
        .groupBy('categoria.id')
        .addGroupBy('categoria.name')
        .getRawMany();

      return {
        ok: true,
        data: resultados,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async getMyOrders(client_id: any) {
    if (client_id) {
      const allPedidos = (
        await this.pedidoRepository.find({
          where: { cliente_id: client_id, available: true, finalizado: false },
          relations: [
            'pedidosprod',
            'pedidosprod.producto',
            'estado',
            'cambioEstados',
          ],
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
    console.log('voy a crear pedido con', createPedidoDto);

    try {
      const currentOrders = await this.pedidoRepository
        .createQueryBuilder('pedido')
        .leftJoinAndSelect('pedido.estado', 'estado')
        .where('pedido.cliente_id = :clienteId', {
          clienteId: createPedidoDto?.clienteId,
        })
        .andWhere('pedido.available = :available', { available: true })
        .andWhere('pedido.finalizado = :finalizado', { finalizado: false })
        .andWhere('pedido.fecha >= :hoy', {
          hoy: moment().startOf('day').toDate(),
        })
        .getMany();
      console.log("currentOrders", currentOrders)
      if (currentOrders?.length > 3) {
        throw new BadRequestException(
          'No se pueden tener mas de 3 ordenes activas.',
        );
      }

      const [firstStatus] = await this.estadoRepository.find({
        order: { order: 'ASC' },
        take: 1,
      });
      const tipoServicio = await this.tipoServicioRepository.findOne({
        where: { tipo: createPedidoDto.empresaType },
      });

      let existChatPreview = undefined;

      if (createPedidoDto.chatId) {
        existChatPreview = await this.chatRepository.findOne({
          where: { chatIdExternal: createPedidoDto.chatId },
        });
      }

      let originalChat = undefined;
      if (createPedidoDto?.originalChatId) {
        originalChat = await this.chatRepository.findOne({
          where: { id: Number(createPedidoDto?.originalChatId) },
        });
      }

      if (!firstStatus) {
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
        newPedido.estado = firstStatus;
        newPedido.withIA = createPedidoDto?.withIA ?? false;
        newPedido.tipo_servicio_id = tipoServicio.id;
        newPedido.available = true;
        newPedido.fecha =
          createPedidoDto.empresaType === 'RESERVA'
            ? createPedidoDto.fecha || products[0].fecha
            : getCurrentDate();
        newPedido.infoLinesJson = infoLineToJson;
        if (createPedidoDto?.chatId) {
          newPedido.chatIdWhatsapp = createPedidoDto.chatId.toString();
        }
        newPedido.detalle_pedido = createPedidoDto?.detalles ?? '';

        if (existChatPreview) {
          newPedido.chat = existChatPreview;
        }
        if (originalChat) {
          newPedido.chat = originalChat;
        }

        const savedPedido = await this.pedidoRepository.save(newPedido);

        const newStatusOrder = await this.cambioEstadoRepository.create({
          estado: firstStatus,
          pedido: newPedido,
          createdAt: new Date(),
          id_user: null,
        });

        await this.cambioEstadoRepository.save(newStatusOrder);

        const productIds = products.map((product) => product.productoId);
        const existingProducts = await this.productoRespitory.find({
          where: { id: In(productIds) },
        });

        try {
          await Promise.all(
            products.map(async (product) => {
              let producto = '';

              const productExist = existingProducts.find(
                (p) => p.id == product.productoId,
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

        const formatToSendFrontend = {
          clientName: createPedidoDto.clientName,
          direccion:
            createPedidoDto?.infoLinesJson?.direccion || 'No hay direccion',
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
      console.log('error', error);
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
        relations: [
          'cambioEstados',
          'chat',
          'pedidosprod',
          'estado',
          'cambioEstados.pedido',
          'cambioEstados.estado',
        ],
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
          estadoActual: pedidoExist.estado,
          cambiosEstado: pedidoExist.cambioEstados,
          detalle_pedido: pedidoExist?.detalle_pedido,
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

  async orderPlanStatus() {
    try {
      const empresa = await this.empresaRepository.findOne({
        where: { db_name: process.env.SUBDOMAIN },
        relations: ['payment', 'payment.plan'],
      });
      if (!empresa) {
        throw new Error('Emrpesa no valida');
      }
      const maxPedidos = empresa.payment.isActive()
        ? (empresa?.payment?.plan?.maxPedidos ?? 0)
        : 0;

      const startOfMonth = moment()
        .tz(empresa.timeZone)
        .startOf('month')
        .toDate();
      const endOfMonth = moment().tz(empresa.timeZone).endOf('month').toDate();

      const currentMonthPedidos = await this.pedidoRepository
        .createQueryBuilder('pedido')
        .where('pedido.withIA = :withIA', { withIA: true })
        .andWhere('pedido.created_at BETWEEN :start AND :end', {
          start: startOfMonth,
          end: endOfMonth,
        })
        .getCount();

      return {
        currentMonthPedidos: currentMonthPedidos,
        slotsToCreate: maxPedidos - (currentMonthPedidos ?? 0),
        maxPedidos: maxPedidos,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al obtener estado de la empresa',
        error: 'Bad Request',
      });
    }
  }

  async findOrders(
    filter: 'active' | 'pending' | 'finished',
    offset: number,
    limit: number,
  ) {
    try {
      if (!filter) {
        throw new BadRequestException(
          'Please specify what type of order you wish to access',
        );
      }

      const query = this.pedidoRepository
        .createQueryBuilder('pedido')
        .leftJoinAndSelect('pedido.pedidosprod', 'pedidosprod')
        .leftJoinAndSelect('pedidosprod.producto', 'producto')
        .innerJoinAndSelect('pedido.estado', 'estado')
        .where('pedido.available = :available', { available: true });

      if (filter === 'pending') {
        query.andWhere('pedido.confirmado = :confirmado', {
          confirmado: false,
        });
      } else if (filter === 'finished') {
        query
          .andWhere('pedido.confirmado = :confirmado', { confirmado: true })
          .andWhere('estado.finalizador = :finalizador', { finalizador: true });
      } else if (filter === 'active') {
        query
          .andWhere('pedido.confirmado = :confirmado', { confirmado: true })
          .andWhere('estado.finalizador = :finalizador', {
            finalizador: false,
          });
      }

      const totalItems = await query.getCount();

      query.orderBy('pedido.createdAt', 'DESC').take(limit).skip(offset);

      const pedidos = await query.getMany();

      const clienteIds = pedidos.map((pedido) => pedido.cliente_id);
      const clientes = await this.clienteRepository.findByIds(clienteIds);

      const clienteMap = new Map(
        clientes.map((cliente) => [cliente.id, cliente]),
      );

      const pedidosFinal = pedidos.map((pedido) => {
        const infoLinesJson = JSON.parse(pedido.infoLinesJson || '{}');
        const direcciones = infoLinesJson?.direccion || 'No hay direccion';
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
          estado: pedido?.estado,
          confirmado: pedido?.confirmado,
          detalle: pedido.detalle_pedido,
          orderId: pedido.id,
          date: pedido.fecha,
          status: pedido.confirmado,
          createdAt: pedido?.createdAt,
        };
      });

      return {
        ok: true,
        statusCode: 200,
        data: pedidosFinal,
        totalItems,
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

  async obtenerDisponibilidadActivasByFecha(
    fecha: string,
    withPast = false,
  ): Promise<string[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });

    const { hora_apertura, hora_cierre, intervaloTiempoCalendario, timeZone } =
      empresa;

    if (!hora_apertura || !hora_cierre || !timeZone) return [];

    const apertura = moment.tz(
      `${fecha} ${hora_apertura}`,
      'YYYY-MM-DD HH:mm:ss',
      timeZone,
    );
    const cierre = moment.tz(
      `${fecha} ${hora_cierre}`,
      'YYYY-MM-DD HH:mm:ss',
      timeZone,
    );

    if (cierre.isBefore(apertura)) {
      cierre.add(1, 'day');
    }

    const now = moment.tz(timeZone);

    const query = this.pedidoRepository
      .createQueryBuilder('pedido')
      .where(`pedido.fecha >= :inicioUTC AND pedido.fecha < :finUTC`, {
        inicioUTC: apertura.clone().utc().format('YYYY-MM-DD HH:mm:ss'),
        finUTC: cierre.clone().utc().format('YYYY-MM-DD HH:mm:ss'),
      })
      .andWhere('pedido.available = :available', { available: true });
    // ver si conviene el fitro de confirmado: true

    console.log('withPast', withPast);
    if (!withPast) {
      query.andWhere('pedido.fecha > :nowUtc', {
        nowUtc: now.format('YYYY-MM-DD HH:mm:ss'),
      });
    }

    const pedidos = await query.getMany();

    const disponibilidad: string[] = [];
    const dontIncludeDisp: string[] = [];

    let actual = apertura.clone();

    while (actual.isBefore(cierre)) {
      const actualDate = actual.clone().format('YYYY-MM-DD HH:mm');
      const overlapping = pedidos.some((pedido) => {
        const inicio = moment(pedido.fecha);
        const fin = inicio.clone().add(intervaloTiempoCalendario, 'minutes');
        const actualUtc = actual.clone().utc().add(-3, 'hours');
        const isBetween = actualUtc.isBetween(inicio, fin, undefined, '[)');

        if (isBetween) {
          dontIncludeDisp.push(inicio.format('YYYY-MM-DD HH:mm'));
        }
        return isBetween;
      });
      let conditionToAdd = false;
      if (withPast === true) {
        conditionToAdd = withPast;
      } else {
        conditionToAdd = !actual.isBefore(now);
      }
      if (conditionToAdd && !overlapping) {
        if (!dontIncludeDisp.includes(actualDate)) {
          disponibilidad.push(actualDate);
        }
      }

      actual.add(intervaloTiempoCalendario, 'minutes');
    }

    return disponibilidad;
  }

  async obtenerDisponibilidadActivasPorRango(
    fechaInicio: string,
    fechaFin: string,
  ): Promise<string[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });

    const { hora_apertura, hora_cierre, intervaloTiempoCalendario, timeZone } =
      empresa;

    if (!hora_apertura || !hora_cierre || !timeZone) return [];

    const inicio = moment.tz(fechaInicio, 'YYYY-MM-DD', timeZone);
    const fin = moment.tz(fechaFin, 'YYYY-MM-DD', timeZone);

    const allDisponibilidades: string[] = [];
    const now = moment.tz(timeZone);

    for (let m = inicio.clone(); m.isSameOrBefore(fin); m.add(1, 'day')) {
      const apertura = moment.tz(
        `${m.format('YYYY-MM-DD')} ${hora_apertura}`,
        'YYYY-MM-DD HH:mm:ss',
        timeZone,
      );
      const cierre = moment.tz(
        `${m.format('YYYY-MM-DD')} ${hora_cierre}`,
        'YYYY-MM-DD HH:mm:ss',
        timeZone,
      );

      const dontIncludeDisp: string[] = [];

      if (cierre.isBefore(apertura)) {
        cierre.add(1, 'day');
      }

      const pedidos = await this.pedidoRepository
        .createQueryBuilder('pedido')
        .where(`pedido.fecha >= :inicioUTC AND pedido.fecha < :finUTC`, {
          inicioUTC: apertura.clone().utc().format('YYYY-MM-DD HH:mm:ss'),
          finUTC: cierre.clone().utc().format('YYYY-MM-DD HH:mm:ss'),
        })
        .andWhere('pedido.confirmado = :confirmado', { confirmado: true })
        .andWhere('pedido.finalizado = :finalizado', { finalizado: false })
        .andWhere('pedido.available = :available', { available: true })
        .getMany();

      let actual = apertura.clone();
      while (actual.isBefore(cierre)) {
        const overlapping = pedidos.some((pedido) => {
          const inicio = moment(pedido.fecha);
          const fin = inicio.clone().add(intervaloTiempoCalendario, 'minutes');
          const actualUtc = actual.clone().utc().add(-3, 'hours');
          const isBetween = actualUtc.isBetween(inicio, fin, undefined, '[)');

          if (isBetween) {
            dontIncludeDisp.push(inicio.format('YYYY-MM-DD HH:mm'));
          }
          return isBetween;
        });
        if (!actual.isBefore(now)) {
          if (!overlapping) {
            const newDateToAdd = actual.clone().format('YYYY-MM-DD HH:mm');
            if (!dontIncludeDisp.includes(newDateToAdd)) {
              allDisponibilidades.push(newDateToAdd);
            }
          }
        }

        actual.add(intervaloTiempoCalendario, 'minutes');
      }
    }

    return allDisponibilidades;
  }

  async getNextDateTimeAvailable(timeZone: string): Promise<any> {
    try {
      const empresaInfo = await this.empresaRepository.findOne({
        where: { db_name: process.env.SUBDOMAIN },
      });

      if (!empresaInfo) {
        throw new Error('Empresa no encontrada');
      }

      const { hora_apertura, hora_cierre, intervaloTiempoCalendario } =
        empresaInfo;

      if (
        !hora_apertura ||
        !hora_cierre ||
        !timeZone ||
        !intervaloTiempoCalendario
      ) {
        throw new Error('Faltan datos de configuración de la empresa');
      }

      const today = moment().tz(timeZone).format('YYYY-MM-DD');
      let fechaActual = today;
      const maxDays = 15;

      const fechaFin = moment(fechaActual)
        .add(maxDays, 'days')
        .format('YYYY-MM-DD');

      const disponibilidades = await this.obtenerDisponibilidadActivasPorRango(
        fechaActual,
        fechaFin,
      );

      if (disponibilidades.length > 0) {
        return disponibilidades[0];
      } else {
        throw new Error(
          'No hay disponibilidades disponibles en los próximos 15 días',
        );
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
            product: pedidoProd?.producto?.nombre,
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

      const clientId = pedido?.cliente_id;

      const client = await this.clienteRepository.findOne({
        where: { id: clientId },
      });

      pedido.confirmado = true;

      await this.pedidoRepository.save(pedido);

      if (client) {
        await this.messageQueue.add(
          'send',
          {
            message: `Su ${pedido?.tipo_servicio_id === TIPO_SERVICIO_DELIVERY_ID ? 'Orden' : 'Reserva'} numero #${pedido?.id} fue confirmado exitosamente 🎉`,
            chatId: pedido?.chatIdWhatsapp,
          },
          {
            priority: 0,
            attempts: 5,
          },
        );
      }
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
    console.log('voy a editar', id, updatePedidoDto);
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

        let newInfoLines = {};
        try {
          console.log('typeof 1 value', typeof value, value);
          newInfoLines = typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
          console.error('Error al parsear infoLinesJson entrante:', e);
        }

        const mergedInfo = {
          ...currentInfoLines,
          ...newInfoLines,
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
        where: { fecha: Between(startDay, endDay), confirmado: true },
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
        where: { available: true, finalizado: false },
        take: 3,
        relations: ['pedidosprod', 'pedidosprod.producto'],
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
