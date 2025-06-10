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
import * as moment from 'moment-timezone';
import { Category } from 'src/category/entities/category.entity';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { TIPO_SERVICIO_DELIVERY_ID } from 'src/database/seeders/app/tipopedido.seed';
import { DeviceService } from 'src/device/device.service';
import { Reclamo } from './entities/reclamo.entity';
import { PaymentMethod } from 'src/paymentMethod/entities/paymentMethod.entity';
import { HorarioService } from 'src/horario/horario.service';
import { CierreProvisorio } from 'src/cierreProvisorio/entities/cierreProvisorio.entitty';
import { SalesByCategoryDto } from './dto/sales-by-category.dto';

@Injectable()
export class PedidoService implements OnModuleDestroy {
  private tipoServicioRepository: Repository<Tiposervicio>;
  private empresaRepository: Repository<Empresa>;
  private cierreProvisorioRepo: Repository<CierreProvisorio>;
  private globalConnection: DataSource;

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepo: Repository<PaymentMethod>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    @InjectRepository(Cambioestadopedido)
    private cambioEstadoRepository: Repository<Cambioestadopedido>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Mensaje)
    private readonly productoPedidoService: ProductopedidoService,
    @InjectRepository(Producto)
    private readonly productoRespitory: Repository<Producto>,
    private readonly webSocketService: WebsocketGateway,
    @InjectRepository(Category)
    private readonly categoryService: Repository<Category>,
    @InjectRepository(ProductoPedido)
    private readonly productoPedidoRepository: Repository<ProductoPedido>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Reclamo)
    private readonly reclamoRepo: Repository<Reclamo>,
    @InjectQueue(`sendMessageChangeStatusOrder-${process.env.SUBDOMAIN}`)
    private readonly messageQueue: Queue,
    private readonly deviceService: DeviceService,
    private readonly horarioService: HorarioService,
  ) {}

  async onModuleInit() {
    if (!this.globalConnection) {
      this.globalConnection = await handleGetGlobalConnection();
    }
    this.tipoServicioRepository =
      this.globalConnection.getRepository(Tiposervicio);
    this.empresaRepository = this.globalConnection.getRepository(Empresa);
    this.cierreProvisorioRepo =
      this.globalConnection.getRepository(CierreProvisorio);
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
        const precio = (prod as any)?.precio || 0;
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

  async cancel(pedidoId: any, fromIA: boolean = false) {
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
      if (client && !fromIA) {
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

      const resp = await this.pedidoRepository.save(pedido);
      return resp;
    }
  }

  async onModuleDestroy() {
    if (this.globalConnection && this.globalConnection.isInitialized) {
      await this.globalConnection.destroy();
    }
  }

  async getSalesByCategory(filter: any) {
    const now = moment();
    let fromDate: Date;

    switch (filter) {
      case 'lastDay':
        fromDate = now.clone().subtract(1, 'day').toDate();
        break;
      case 'lastWeek':
        fromDate = now.clone().subtract(7, 'days').toDate();
        break;
      case 'lastMonth':
        fromDate = now.clone().subtract(1, 'month').toDate();
        break;
      default:
        throw new BadRequestException('Invalid filter');
    }

    const query = this.productoPedidoRepository
      .createQueryBuilder('pp')
      .innerJoin('pp.producto', 'producto')
      .innerJoin('producto.category', 'category')
      .innerJoin('pp.pedido', 'pedido')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('SUM(pp.cantidad)', 'totalVentas')
      .where('pedido.createdAt >= :fromDate', { fromDate })
      .andWhere('pedido.available = :available', { available: true })
      .andWhere('pedido.confirmado = :confirmado', { confirmado: true })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('SUM(pp.cantidad)', 'DESC')
      .limit(10);

    const result = await query.getRawMany();

    const totalVentasGlobal = result.reduce(
      (acc, curr) => acc + parseInt(curr.totalVentas, 10),
      0,
    );

    return result.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      totalVentas: parseInt(r.totalVentas, 10),
      porcentaje:
        totalVentasGlobal === 0
          ? 0
          : parseFloat(((r.totalVentas / totalVentasGlobal) * 100).toFixed(2)),
    }));
  }

  async getSalesOverview() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const total = await this.productoPedidoRepository
      .createQueryBuilder('pp')
      .innerJoin('pp.pedido', 'pedido')
      .select('SUM(pp.cantidad * pp.precio)', 'total')
      .where('pedido.fecha >= :startOfThisMonth', { startOfThisMonth })
      .andWhere('pedido.available = true')
      .andWhere('pedido.finalizado = false')
      .getRawOne();

    const previous = await this.productoPedidoRepository
      .createQueryBuilder('pp')
      .innerJoin('pp.pedido', 'pedido')
      .select('SUM(pp.cantidad * pp.precio)', 'total')
      .where('pedido.fecha BETWEEN :startOfLastMonth AND :endOfLastMonth', {
        startOfLastMonth,
        endOfLastMonth,
      })
      .andWhere('pedido.available = true')
      .andWhere('pedido.confirmado = true')
      .getRawOne();

    const totalValue = Number(total?.total || 0);
    const previousValue = Number(previous?.total || 0);

    const average = totalValue / now.getDate();

    const variation =
      previousValue > 0
        ? ((totalValue - previousValue) / previousValue) * 100
        : 0;

    return {
      total: totalValue,
      previous: previousValue,
      average: Math.round(average),
      variation: parseFloat(variation.toFixed(1)),
    };
  }

 async getSalesLastSixMonths() {
  const endDate = moment().endOf('day').toDate();
  const startDate = moment().subtract(6, 'months').startOf('month').toDate();

  const pedidos = await this.pedidoRepository.find({
    where: {
      confirmado: true,
      available: true,
      fecha: Between(startDate, endDate),
    },
    relations: ['productoPedidos'],
  });

  const grouped = new Map<string, number>();

  pedidos.forEach((pedido) => {
    const date = moment(pedido.fecha);
    const key = date.format('YYYY-MM');

    const total = pedido.pedidosprod.reduce((acc, pp) => {
      return acc + (pp.cantidad ?? 1) * (pp.precio ?? 0);
    }, 0);

    grouped.set(key, (grouped.get(key) || 0) + total);
  });

  const labels: string[] = [];
  const monthlySales: number[] = [];

  for (let i = 0; i < 6; i++) {
    const m = moment(startDate).add(i, 'months');
    const key = m.format('YYYY-MM');
    labels.push(
      m.format('MMM').charAt(0).toUpperCase() + m.format('MMM').slice(1),
    );
    monthlySales.push(grouped.get(key) || 0);
  }

  return {
    monthlySales,
    labels,
    period: 'mensual',
  };
}

  async getMyOrders(client_id: any) {
    if (!client_id) {
      return 'No hay pedidos recientes';
    }

    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
      relations: ['tipoServicioId'],
    });

    if (!empresa) {
      throw new BadRequestException('La empresa indicada no existe');
    }

    const isDelivery = empresa.tipoServicioId.id === TIPO_SERVICIO_DELIVERY_ID;

    const now = moment.tz(empresa.timeZone ?? 'America/Montevideo');
    const filterDate = isDelivery
      ? now.clone().subtract(1, 'day').startOf('day')
      : now.clone().startOf('day');

    const allPedidos = await this.pedidoRepository.find({
      where: {
        cliente_id: client_id,
        available: true,
        finalizado: false,
        createdAt: MoreThan(filterDate.toDate()),
      },
      relations: [
        'pedidosprod',
        'pedidosprod.producto',
        'paymentMethod',
        'estado',
        'cambioEstados',
      ],
    });

    const pedidos = await Promise.all(
      allPedidos.map(async (pedido) => {
        const currentReclamo = await this.reclamoRepo.findOne({
          where: { id: Number(pedido?.reclamo) as any },
        });

        return {
          ...pedido,
          estado: pedido?.estado?.nombre,
          estadoTexto: pedido?.estado?.mensaje,
          paymentMethod: pedido?.paymentMethod?.name ?? '',
          pedidosprod: pedido.pedidosprod.map((pedidoProd) => {
            return {
              ...pedidoProd,
              pedido: undefined,
              producto: {
                id: pedidoProd.producto?.id,
                nombre: pedidoProd?.producto?.nombre,
                precio: pedidoProd?.producto?.precio,
                descripcion: pedidoProd?.producto?.descripcion,
                currency_id: pedidoProd?.producto?.currency_id,
              },
            };
          }),
          reclamo: currentReclamo ?? undefined,
        };
      }),
    );

    return JSON.stringify(pedidos);
  }

  async filtertOrdersWithQuery(query: string, keyInfoline: string) {
    try {
      if (!query?.trim()) {
        return {
          ok: true,
          data: [],
        };
      }

      const allOrders = await this.pedidoRepository.find({
        relations: [
          'pedidosprod',
          'pedidosprod.producto',
          'estado',
          'paymentMethod',
        ],
      });

      const clienteIds = allOrders.map((pedido) => pedido.cliente_id);
      const clientes = await this.clienteRepository.findByIds(clienteIds);

      const clienteMap = new Map(
        clientes.map((cliente) => [cliente.id, cliente]),
      );
      const reclamoIds = [
        ...new Set(
          allOrders.map((p) => Number(p.reclamo)).filter((id) => !isNaN(id)),
        ),
      ];
      const reclamos = await this.reclamoRepo.findBy({ id: In(reclamoIds) });

      const reclamoMap = new Map(reclamos.map((r) => [r.id, r]));

      const results = [];

      await Promise.all(
        allOrders.map(async (order) => {
          if (!order.infoLinesJson) return;

          let infoLineFormatedJson;
          try {
            infoLineFormatedJson = JSON.parse(order.infoLinesJson);
          } catch (err) {
            return;
          }

          const key = keyInfoline;

          const value = infoLineFormatedJson[key] ?? null;

          if (
            value &&
            typeof value === 'string' &&
            value.toLowerCase().includes(query.toLowerCase())
          ) {
            const orderFormatedd = await this.getPedido(
              order,
              clienteMap,
              reclamoMap,
            );
            results.push(orderFormatedd);
          }
        }),
      );

      return {
        ok: true,
        data: results,
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
        .andWhere('pedido.withIA = :withIA', { withIA: true })
        .andWhere('pedido.finalizado = :finalizado', { finalizado: false })
        .andWhere('pedido.fecha >= :hoy', {
          hoy: moment().startOf('day').toDate(),
        })
        .getMany();
      console.log('currentOrders', currentOrders?.length);
      if (currentOrders?.length > 3) {
        throw new BadRequestException(
          'No se pueden tener mas de 3 ordenes activas.',
        );
      }

      const clientExist = await this.clienteRepository.findOne({
        where: { id: createPedidoDto.clienteId },
      });

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
        const infoLineToJson = createPedidoDto.infoLinesJson;

        const newPedido = new Pedido();
        newPedido.confirmado = createPedidoDto.confirmado || false;
        newPedido.cliente_id = createPedidoDto.clienteId;
        newPedido.estado = firstStatus;
        newPedido.transferUrl = createPedidoDto?.transferUrl;
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

        if (clientExist) {
          newPedido.client = clientExist;
        }

        if (
          createPedidoDto?.paymentMethodId &&
          createPedidoDto?.paymentMethodId !== ''
        ) {
          const paymentMethod = await this.paymentMethodRepo.findOne({
            where: { id: Number(createPedidoDto?.paymentMethodId) },
          });
          if (paymentMethod?.id) {
            newPedido.paymentMethod = paymentMethod;
          }
        }

        if (existChatPreview) {
          newPedido.chat = existChatPreview;
        }
        if (originalChat) {
          newPedido.chat = originalChat;
        }

        if (createPedidoDto?.userId) {
          newPedido.owner_user_id = createPedidoDto?.userId;
        }

        const savedPedido = await this.pedidoRepository.save(newPedido);

        const newStatusOrder = await this.cambioEstadoRepository.create({
          estado: firstStatus,
          pedido: newPedido,
          createdAt: new Date(),
          id_user: null,
        });

        await this.cambioEstadoRepository.save(newStatusOrder);

        const productIds = products.map((product) =>
          parseInt(product.productoId),
        );
        const existingProducts = await this.productoRespitory.find({
          where: { id: In(productIds) },
        });

        try {
          await Promise.all(
            products.map(async (product) => {
              const productExist = existingProducts.find(
                (p) => p.id == parseInt(product.productoId),
              );
              if (!productExist) {
                throw new Error(
                  `Producto con ID ${product.productoId} no encontrado`,
                );
              }

              total += productExist.precio * product.cantidad;

              const newProdPedido = await this.productoPedidoRepository.create({
                precio: productExist.precio,
                cantidad: product.cantidad,
                productoId: parseInt(product.productoId),
                pedidoId: savedPedido.id,
                producto: productExist,
                pedido: savedPedido,
                detalle: product.detalle ?? 'No detalle',
              });

              await this.productoPedidoRepository.save(newProdPedido);
            }),
          );
        } catch (error) {
          console.error('Error al crear productos:', error);
        }

        const formatToSendFrontend = {
          ...savedPedido,
          clientName: createPedidoDto.clientName,
          direccion:
            createPedidoDto?.infoLinesJson?.direccion ||
            createPedidoDto?.infoLinesJson?.Direccion ||
            createPedidoDto?.infoLinesJson?.address ||
            'No hay direccion',
          numberSender: createPedidoDto.numberSender,
          total,
          id: savedPedido.id,
          fecha: savedPedido.fecha,
          status: savedPedido.confirmado,
          infoLinesJson: savedPedido.infoLinesJson,
          createdAt: savedPedido.createdAt,
        };

        globalTotal += total;
        this.webSocketService.sendOrder(formatToSendFrontend);
        return formatToSendFrontend;
      };

      let responseFormat;

      if (tipoServicio.tipo === 'RESERVA') {
        responseFormat = await crearNuevoPedido(createPedidoDto.products);
        // await Promise.all(
        //   (responseFormat = createPedidoDto.products.map((product) =>
        //     crearNuevoPedido([product]),
        //   )),
        // );
      } else {
        responseFormat = await crearNuevoPedido(createPedidoDto.products);
      }

      return {
        statusCode: 200,
        ok: true,
        message: 'Pedido creado exitosamente',
        messageToUser: createPedidoDto?.messageToUser
          ? createPedidoDto?.messageToUser
          : messageFinal + '\n\nTotal:' + globalTotal,
        formatToSendFrontend: responseFormat,
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
          'paymentMethod',
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

      const currentReclamo = await this.reclamoRepo.findOne({
        where: { id: Number(pedidoExist?.reclamo) as any },
      });

      let total = 0;
      let estimateTime = 0;
      const pedidosProdFormated = await Promise.all(
        pedidoExist.pedidosprod.map(async (data) => {
          const productoInfo = await this.productoRespitory.findOne({
            where: { id: data.productoId },
          });
          total += data.cantidad * data.precio;
          estimateTime += productoInfo.plazoDuracionEstimadoMinutos;

          return {
            productoInfo,
            pedidoId: data.pedidoId,
            detalle: data.detalle,
            cantidad: data.cantidad,
            precio: data.precio,
          };
        }),
      );

      return {
        ok: true,
        statusCode: 200,
        data: {
          client: {
            name: getClient?.nombre ?? 'No name',
            phone: getClient?.telefono ?? 'No phone',
            id: getClient?.id ?? 'No id',
          },
          reclamo: currentReclamo ?? undefined,
          products: pedidosProdFormated,
          chatId: pedidoExist.chat,
          date: pedidoExist.fecha,
          confirm: pedidoExist.confirmado,
          paymentMethod: pedidoExist?.paymentMethod,
          transferUrl: pedidoExist?.transferUrl,
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
        .andWhere('pedido.fecha BETWEEN :start AND :end', {
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

  async getPedido(
    pedido: Pedido,
    clienteMap: Map<number, any>,
    reclamoMap: Map<number, any>,
  ) {
    const currentReclamo = pedido.reclamo
      ? reclamoMap.get(Number(pedido.reclamo))
      : undefined;

    const infoLinesJson = JSON.parse(pedido.infoLinesJson || '{}');
    const direcciones =
      infoLinesJson?.direccion ||
      infoLinesJson?.Direccion ||
      'No hay direccion';

    let total = 0;
    pedido.pedidosprod.forEach((producto) => {
      total += producto.precio * producto.cantidad;
    });

    const clienteData = clienteMap.get(pedido.cliente_id);

    return {
      clientName: clienteData?.nombre || 'Desconocido',
      direccion: direcciones,
      numberSender: clienteData?.telefono || 'N/A',
      total,
      reclamo: currentReclamo ?? undefined,
      estado: pedido?.estado,
      confirmado: pedido?.confirmado,
      detalle: pedido.detalle_pedido,
      orderId: pedido.id,
      available: pedido?.available,
      date: pedido.fecha,
      transferUrl: pedido?.transferUrl,
      status: pedido.confirmado,
      createdAt: pedido?.createdAt,
    };
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
        .innerJoinAndSelect('pedido.estado', 'estado');

      if (filter === 'pending') {
        query
          .andWhere('pedido.confirmado = :confirmado', {
            confirmado: false,
          })
          .andWhere('pedido.finalizado = :finalizado', { finalizado: false })
          .andWhere('pedido.available = :available', { available: true });
      } else if (filter === 'finished') {
        query
          .where('pedido.finalizado = :finalizado', { finalizado: true })
          .andWhere('pedido.available = :available', { available: true });
      } else if (filter === 'active') {
        query
          .andWhere('pedido.confirmado = :confirmado', { confirmado: true })
          .andWhere('estado.finalizador = :finalizador', {
            finalizador: false,
          });
      }

      const totalItems = await query.getCount();

      query
        .addSelect(
          "CASE WHEN pedido.reclamo != '' THEN 0 ELSE 1 END",
          'custom_order',
        )
        .orderBy('custom_order', 'ASC')
        .addOrderBy('pedido.createdAt', 'DESC')
        .take(limit)
        .skip(offset);

      const pedidos = await query.getMany();

      const clienteIds = [...new Set(pedidos.map((p) => p.cliente_id))];
      const reclamoIds = [
        ...new Set(
          pedidos.map((p) => Number(p.reclamo)).filter((id) => !isNaN(id)),
        ),
      ];

      const clientes = await this.clienteRepository.findByIds(clienteIds);
      const reclamos = await this.reclamoRepo.findBy({ id: In(reclamoIds) });

      const clienteMap = new Map(clientes.map((c) => [c.id, c]));
      const reclamoMap = new Map(reclamos.map((r) => [r.id, r]));

      const pedidosFinal = await Promise.all(
        pedidos.map((pedido) => this.getPedido(pedido, clienteMap, reclamoMap)),
      );

      return {
        ok: true,
        statusCode: 200,
        data: pedidosFinal,
        totalItems,
      };
    } catch (error) {
      console.log('aca xd', error);
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
    userId?: any,
  ): Promise<string[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });

    const { intervaloTiempoCalendario, timeZone = 'America/Montevideo' } =
      empresa;
    const diaSemana = moment(fecha).endOf('day').tz(timeZone).isoWeekday();
    const horariosDia = await this.horarioService.findByDay(diaSemana);
    console.log('diaSemana', diaSemana);
    console.log('horariosDia', horariosDia);
    if (!timeZone || !intervaloTiempoCalendario || !horariosDia) return [];

    if (horariosDia.length === 0) return [];

    const now = moment.tz(timeZone);
    const disponibilidad: string[] = [];
    const pedidosExistentes = await this.pedidoRepository.find({
      where: {
        available: true,
        finalizado: false,
        owner_user_id: userId,
        fecha: Between(
          moment.tz(`${fecha} 00:00`, timeZone).utc().toDate(),
          moment.tz(`${fecha} 23:59:59`, timeZone).utc().toDate(),
        ),
      },
    });

    const cierresProvisorios = await this.cierreProvisorioRepo.find({
      where: {
        empresa: { id: empresa.id },
        final: MoreThan(now.clone().subtract('3', 'hours').toDate()),
      },
    });

    for (const horario of horariosDia) {
      const apertura = moment.tz(
        `${fecha} ${horario.hora_inicio}`,
        'YYYY-MM-DD HH:mm',
        timeZone,
      );
      let cierre = moment.tz(
        `${fecha} ${horario.hora_fin}`,
        'YYYY-MM-DD HH:mm',
        timeZone,
      );

      // Si cierra después de medianoche
      if (cierre.isBefore(apertura)) {
        cierre.add(1, 'day');
      }

      let actual = apertura.clone();

      while (actual.isBefore(cierre)) {
        const actualDate = actual.clone().format('YYYY-MM-DD HH:mm');
        const actualUtc = actual.clone().utc().add(-3, 'hours');

        const overlapping = pedidosExistentes.some((pedido) => {
          const inicio = moment.utc(pedido.fecha);
          const fin = inicio.clone().add(intervaloTiempoCalendario, 'minutes');
          return actualUtc.isBetween(inicio, fin, undefined, '[)');
        });

        const enCierreProvisorio = cierresProvisorios.some((cierre) => {
          const inicio = moment.tz(cierre.inicio, timeZone).utc();
          const fin = moment.tz(cierre.final, timeZone).utc();
          return actualUtc.isBetween(inicio, fin, undefined, '[)');
        });

        const conditionToAdd = withPast || !actual.isBefore(now);

        if (conditionToAdd && !overlapping && !enCierreProvisorio) {
          if (!disponibilidad.includes(actualDate)) {
            disponibilidad.push(actualDate);
          }
        }

        actual.add(intervaloTiempoCalendario, 'minutes');
      }
    }

    return disponibilidad;
  }

  async obtenerDisponibilidadActivasPorRango(
    fechaInicio: string,
    fechaFin: string,
    userId?: any,
  ): Promise<string[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });

    const { intervaloTiempoCalendario, timeZone = 'America/Montevideo' } =
      empresa;

    if (!intervaloTiempoCalendario || !timeZone) return [];

    const inicio = moment.tz(fechaInicio, 'YYYY-MM-DD', timeZone);
    const fin = moment.tz(fechaFin, 'YYYY-MM-DD', timeZone);
    const now = moment.tz(timeZone);
    const allDisponibilidades: string[] = [];

    for (let m = inicio.clone(); m.isSameOrBefore(fin); m.add(1, 'day')) {
      const fecha = m.format('YYYY-MM-DD');
      const diaSemana = m.isoWeekday();
      const horariosDia = await this.horarioService.findByDay(diaSemana);

      if (!horariosDia || horariosDia.length === 0) continue;

      const pedidosDelDia = await this.pedidoRepository.find({
        where: {
          finalizado: false,
          available: true,
          owner_user_id: userId,
          fecha: Between(
            moment.tz(`${fecha} 00:00`, timeZone).utc().toDate(),
            moment.tz(`${fecha} 23:59:59`, timeZone).utc().toDate(),
          ),
        },
      });

      const cierresProvisorios = await this.cierreProvisorioRepo.find({
        where: {
          empresa: { id: empresa.id },
          final: MoreThan(now.clone().subtract('3', 'hours').toDate()),
        },
      });

      for (const horario of horariosDia) {
        const apertura = moment.tz(
          `${fecha} ${horario.hora_inicio}`,
          'YYYY-MM-DD HH:mm',
          timeZone,
        );
        let cierre = moment.tz(
          `${fecha} ${horario.hora_fin}`,
          'YYYY-MM-DD HH:mm',
          timeZone,
        );

        if (cierre.isBefore(apertura)) {
          cierre.add(1, 'day');
        }

        let actual = apertura.clone();

        while (actual.isBefore(cierre)) {
          const actualDate = actual.clone().format('YYYY-MM-DD HH:mm');
          const actualUtc = actual.clone().utc().add(-3, 'hours');

          const overlapping = pedidosDelDia.some((pedido) => {
            const inicio = moment.utc(pedido.fecha);
            const fin = inicio
              .clone()
              .add(intervaloTiempoCalendario, 'minutes');
            return actualUtc.isBetween(inicio, fin, undefined, '[)');
          });

          const enCierreProvisorio = cierresProvisorios.some((cierre) => {
            const inicio = moment.tz(cierre.inicio, timeZone).utc();
            const fin = moment.tz(cierre.final, timeZone).utc();
            return actualUtc.isBetween(inicio, fin, undefined, '[)');
          });

          if (!actual.isBefore(now) && !overlapping && !enCierreProvisorio) {
            if (!allDisponibilidades.includes(actualDate)) {
              allDisponibilidades.push(actualDate);
            }
          }

          actual.add(intervaloTiempoCalendario, 'minutes');
        }
      }
    }

    return allDisponibilidades;
  }

  async obtenerCuposDisponiblesPorDiaDelMes(
    anio: number,
    mes: number,
    userId?: any,
  ): Promise<{ fecha: string; cuposDisponibles: number }[]> {
    const empresa = await this.empresaRepository.findOne({
      where: { db_name: process.env.SUBDOMAIN },
    });

    const { intervaloTiempoCalendario, timeZone = 'America/Montevideo' } =
      empresa;
    if (!intervaloTiempoCalendario || !timeZone) return [];

    const resultados: {
      fecha: string;
      cuposDisponibles: number;
      dayOfWeek: number;
    }[] = [];

    const inicioMes = moment.tz(
      { year: anio, month: mes - 1, day: 1 },
      timeZone,
    );
    const finMes = inicioMes.clone().endOf('month');
    const now = moment.tz(timeZone);

    for (
      let dia = inicioMes.clone();
      dia.isSameOrBefore(finMes);
      dia.add(1, 'day')
    ) {
      const fechaStr = dia.format('YYYY-MM-DD');
      const diaSemana = dia.isoWeekday();
      const horariosDia = await this.horarioService.findByDay(diaSemana);

      if (!horariosDia || horariosDia.length === 0) {
        resultados.push({
          fecha: fechaStr,
          cuposDisponibles: 0,
          dayOfWeek: diaSemana,
        });
        continue;
      }

      const pedidos = await this.pedidoRepository.find({
        where: {
          finalizado: false,
          available: true,
          owner_user_id: userId,
          fecha: Between(
            moment.tz(`${fechaStr} 00:00`, timeZone).utc().toDate(),
            moment.tz(`${fechaStr} 23:59:59`, timeZone).utc().toDate(),
          ),
        },
      });

      const cierresProvisorios = await this.cierreProvisorioRepo.find({
        where: {
          empresa: { id: empresa.id },
          final: MoreThan(now.clone().subtract('3', 'hours').toDate()),
        },
      });

      let cupos = 0;

      const nowUtc = moment().utc();
      for (const horario of horariosDia) {
        const apertura = moment.tz(
          `${fechaStr} ${horario.hora_inicio}`,
          'YYYY-MM-DD HH:mm',
          timeZone,
        );
        let cierre = moment.tz(
          `${fechaStr} ${horario.hora_fin}`,
          'YYYY-MM-DD HH:mm',
          timeZone,
        );
        if (cierre.isBefore(apertura)) cierre.add(1, 'day');

        let actual = apertura.clone();

        while (actual.isBefore(cierre)) {
          const actualUtc = actual.clone().utc().add(-3, 'hours');

          const overlapping = pedidos.some((pedido) => {
            const inicio = moment.utc(pedido.fecha);
            const fin = inicio
              .clone()
              .add(intervaloTiempoCalendario, 'minutes');
            return actualUtc.isBetween(inicio, fin, undefined, '[)');
          });

          const enCierreProvisorio = cierresProvisorios.some((cierre) => {
            const inicio = moment.tz(cierre.inicio, timeZone).utc();
            const fin = moment.tz(cierre.final, timeZone).utc();
            return actualUtc.isBetween(inicio, fin, undefined, '[)');
          });

          if (
            actualUtc.isAfter(nowUtc) &&
            !overlapping &&
            !enCierreProvisorio
          ) {
            console.log('agrego cupo');
            cupos++;
          }

          actual.add(intervaloTiempoCalendario, 'minutes');
        }
      }

      console.log('cupos', cupos);

      resultados.push({
        fecha: fechaStr,
        cuposDisponibles: cupos,
        dayOfWeek: diaSemana,
      });
    }

    return resultados;
  }

  async getNextDateTimeAvailable(timeZone: string, userId?: any): Promise<any> {
    try {
      const empresaInfo = await this.empresaRepository.findOne({
        where: { db_name: process.env.SUBDOMAIN },
      });

      if (!empresaInfo) {
        throw new Error('Empresa no encontrada');
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
        userId,
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

  async getOrdersForCalendar(dateTime: string, timeZone: string, userId?: any) {
    try {
      const now = getCurrentDate();
      const filterDate = moment(dateTime, 'YYYY-MM-DD').startOf('day');

      const filterDateStart = filterDate.startOf('day').toDate();
      const filterDateEnd = filterDate.endOf('day').toDate();

      const pedidos = await this.pedidoRepository.find({
        where: {
          available: true,
          fecha: Between(filterDateStart, filterDateEnd),
          owner_user_id: userId,
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
            total: pedidoProd?.cantidad * pedidoProd?.precio,
            date: isOlder ? pedidoDate.format('LT') : pedidoDate.fromNow(),
            fecha: pedido.fecha,
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

  async confirmOrder(id: number) {
    try {
      const pedido = await this.pedidoRepository.findOne({
        where: { id: id },
      });

      if (!pedido) {
        throw new BadRequestException('There is no order with that ID');
      }

      const clientId = pedido?.cliente_id;
      const client = await this.clienteRepository.findOne({
        where: { id: clientId },
      });
      pedido.confirmado = true;
      await this.pedidoRepository.save(pedido);

      const pedidosProd = await this.productoPedidoRepository.find({
        where: { pedidoId: pedido.id },
        relations: ['producto'],
      });

      if (client) {
        const esDelivery =
          pedido.tipo_servicio_id === TIPO_SERVICIO_DELIVERY_ID;
        const tipo = esDelivery ? 'Orden' : 'Reserva';

        const productosList = pedidosProd
          .map(
            (pp) =>
              `• ${pp.cantidad} x ${pp.producto?.nombre}${pp.detalle ? ` (${pp.detalle})` : ''}`,
          )
          .join('\n');

        const mensaje = `✅ Su ${tipo.toLowerCase()} número *#${pedido.id}* fue confirmada exitosamente 🎉

🧾 Detalle de ${tipo.toLowerCase()}:
${productosList}

¡Gracias por elegirnos! 💚`;

        await this.messageQueue.add(
          'send',
          {
            message: mensaje,
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
        message:
          'Lo siento, ' + error?.message || 'Error al confirmar el pedido',
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

  async createReclamo(pedidoId: number, text: string) {
    console.log('creo reclamo con', pedidoId, text);
    try {
      const pedido = await this.pedidoRepository.findOne({
        where: { id: pedidoId },
        relations: ['chat'],
      });

      if (!pedido) {
        throw new BadRequestException('El pedido no existe');
      }

      const client = await this.clienteRepository.findOne({
        where: { id: pedido.cliente_id },
        relations: ['reclamos'],
      });

      if (!client) {
        throw new BadRequestException('El cliente no existe');
      }

      let reclamo: any = null;

      if (pedido.reclamo && !isNaN(Number(pedido.reclamo))) {
        reclamo = (await this.reclamoRepo.findOne({
          where: { id: Number(pedido.reclamo) },
        })) as any;
      }

      if (reclamo) {
        reclamo.texto = text;
      } else {
        reclamo = this.reclamoRepo.create({
          client,
          texto: text,
        });
      }

      const newReclamo = await this.reclamoRepo.save(reclamo);
      pedido.reclamo = `${newReclamo?.id}`;
      await this.pedidoRepository.save(pedido);

      const messagePushTitle = 'Nuevo reclamo recibido⚠️';
      const messagePush = `El cliente #${client.nombre} realizó un reclamo sobre el pedido #${pedido.id}`;

      const empresa = await this.empresaRepository.findOne({
        where: { db_name: process.env.SUBDOMAIN },
      });

      await this.deviceService.sendNotificationEmpresa(
        empresa.id,
        messagePushTitle,
        messagePush,
      );

      return {
        ok: true,
        message: 'Reclamo procesado correctamente',
        statusCode: 200,
      };
    } catch (error) {
      console.log('error', error);
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al procesar el reclamo',
        error: 'Bad Request',
      });
    }
  }

  async remove(id: number, text?: string) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({
        where: { id: id },
        relations: [
          'cambioEstados',
          'chat',
          'chat.mensajes',
          'pedidosprod',
          'pedidosprod.producto',
        ],
      });

      const client = await this.clienteRepository.findOne({
        where: { id: pedidoExist.cliente_id },
      });
      if (client) {
        const esDelivery =
          pedidoExist?.tipo_servicio_id === TIPO_SERVICIO_DELIVERY_ID;
        const tipo = esDelivery ? 'orden' : 'reserva';

        const productosList = pedidoExist.pedidosprod
          .map(
            (pp) =>
              `• ${pp.cantidad} x ${pp.producto?.nombre}${pp.detalle ? ` (${pp.detalle})` : ''}`,
          )
          .join('\n');

        let message = `⚠️ Tu ${tipo} número *#${pedidoExist.id}* ha sido cancelada por la empresa.

🧾 Detalle de ${tipo}:
${productosList}

Para más información, por favor contactanos.`;

        if (text) {
          message += `\n\n📌 Nota: ${text}`;
        }

        await this.messageQueue.add(
          'send',
          {
            message,
            chatId: pedidoExist?.chatIdWhatsapp,
          },
          {
            priority: 0,
            attempts: 5,
          },
        );
      }

      await this.pedidoRepository.update(id, { available: false });

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
          order.pedidosprod.map((pedidoProd) => {
            ganancia += pedidoProd.cantidad * pedidoProd.precio;
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
          total += pedidoProd.cantidad * pedidoProd.precio;
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
        where: {
          fecha: MoreThan(periods.yearly.toDate()),
          available: true,
          confirmado: true,
        },
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
      total += pedidoProd.cantidad * pedidoProd.precio;
    });
  });

  return total;
};
