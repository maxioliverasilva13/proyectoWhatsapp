import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePedidoEspacioDto } from './dto/create-pedido-reservaEspacio.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { Cambioestadopedido } from 'src/cambioestadopedido/entities/cambioestadopedido.entity';
import { PaymentMethod } from 'src/paymentMethod/entities/paymentMethod.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { Category } from 'src/category/entities/category.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import { Reclamo } from './entities/reclamo.entity';
import { Espacio } from 'src/espacio/entities/espacio';
import * as moment from 'moment-timezone';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { TIPO_SERVICIO_RESERVA_ESPACIO_ID } from 'src/database/seeders/app/tipopedido.seed';
import { HorarioService } from 'src/horario/horario.service';
import { Precio } from 'src/espacio/entities/precio';
import { Chat } from 'src/chat/entities/chat.entity';
import getCurrentDate from 'src/utils/getCurrentDate';

@Injectable()
export class PedidoEspaciosService {

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
        @InjectRepository(Espacio)
        private readonly espacioRepository: Repository<Espacio>,
        private readonly horarioService: HorarioService,
        @InjectRepository(Precio)
        private readonly precioRepository: Repository<Precio>,
        @InjectRepository(Tiposervicio)
        private readonly tipoServicioRepository: Repository<Tiposervicio>,

    ) { }

    async crearPedidoEspacio(createPedidoDto: CreatePedidoEspacioDto) {
        try {
            console.log('creare con', createPedidoDto);

            const currentOrders = await this.pedidoRepository
                .createQueryBuilder('pedido')
                .leftJoinAndSelect('pedido.estado', 'estado')
                .where('pedido.cliente_id = :clienteId', { clienteId: createPedidoDto.clienteId })
                .andWhere('pedido.available = :available', { available: true })
                .andWhere('pedido.finalizado = :finalizado', { finalizado: false })
                .andWhere('pedido.fecha >= :hoy', { hoy: moment().startOf('day').toDate() })
                .getMany();

            if (currentOrders.length > 3) {
                throw new BadRequestException('No se pueden tener más de 3 reservas activas.');
            }
            let chatExist = null;
            if (createPedidoDto.originalChatId) {
                chatExist = await this.chatRepository.findOne({ where: { id: Number(createPedidoDto.originalChatId) } });
            }

            const clientExist = await this.clienteRepository.findOne({ where: { id: createPedidoDto.clienteId } });
            if (!clientExist) {
                throw new BadRequestException('Cliente no encontrado.');
            }

            const espacioExist = await this.espacioRepository.findOne({ where: { id: createPedidoDto.espacio_id } });
            if (!espacioExist) {
                throw new BadRequestException('Espacio no encontrado.');
            }

            const [firstStatus] = await this.estadoRepository.find({ order: { order: 'ASC' }, take: 1 });
            if (!firstStatus) {
                throw new BadRequestException('Estado inicial no encontrado.');
            }

            const precioExist = await this.precioRepository.findOne({
                where: { id: Number(createPedidoDto.precio_id), espacio: { id: createPedidoDto.espacio_id } },
            });

            const newPedido = new Pedido();
            console.log('el cchat ess', chatExist);
            const timeZone = createPedidoDto.timeZone;

            newPedido.confirmado = createPedidoDto.confirmado ?? false;
            newPedido.cliente_id = createPedidoDto.clienteId;
            newPedido.client = { id: createPedidoDto.clienteId } as Cliente;
            newPedido.espacio = espacioExist;
            newPedido.fecha_inicio = moment.parseZone(createPedidoDto.fecha_inicio).toDate();
            newPedido.fecha_fin = moment.parseZone(createPedidoDto.fecha_fin).toDate();
            newPedido.fecha = moment.parseZone(createPedidoDto.fecha_inicio).toDate();
            newPedido.estado = firstStatus;
            newPedido.tipo_servicio_id = TIPO_SERVICIO_RESERVA_ESPACIO_ID;
            newPedido.available = true;
            newPedido.detalle_pedido = createPedidoDto.detalles ?? '';
            newPedido.withIA = true;
            newPedido.precio = { id: Number(createPedidoDto.precio_id) } as Precio;
            newPedido.isDomicilio = false;
            newPedido.cantidad_espacio_precio = createPedidoDto.cantidad_precios_reservados
            newPedido.precio_total = createPedidoDto.cantidad_precios_reservados * precioExist.precio
            if (!!createPedidoDto?.chatId) {
                newPedido.chatIdWhatsapp = createPedidoDto.chatId.toString();
            }
            if (!!createPedidoDto.originalChatId) {
                newPedido.chat = chatExist
            }
            if (createPedidoDto.paymentMethodId) {
                const paymentMethod = await this.paymentMethodRepo.findOne({ where: { id: Number(createPedidoDto.paymentMethodId) } });
                if (paymentMethod) {
                    newPedido.paymentMethod = paymentMethod;
                }
            }
            newPedido.infoLinesJson = createPedidoDto.infoLinesJson;
            const savedPedido = await this.pedidoRepository.save(newPedido);

            await this.cambioEstadoRepository.save({
                estado: { id: firstStatus.id },
                pedido: { id: savedPedido.id },
                createdAt: new Date(),
                id_user: createPedidoDto.userId ? Number(createPedidoDto.userId) : null,
            });

            return {
                statusCode: 200,
                ok: true,
                message: 'Reserva de espacio creada exitosamente',
                data: savedPedido,
                messageToUser: createPedidoDto.messageToUser || `Reserva para espacio "${espacioExist.nombre}" confirmada.`,
            };
        } catch (error) {
            console.error(error);
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error.message || 'Error al crear la reserva',
                error: 'Bad Request',
            });
        }
    }

    async calcularDisponibilidadEspacio(
        espacio_id: number,
        fecha: string,
        withPast = false
    ): Promise<string[]> {
        const espacio = await this.espacioRepository.findOne({ where: { id: espacio_id } });
        if (!espacio) return [];

        const timeZone = 'America/Montevideo';
        const fmt = ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss'];

        const diaSemana = moment.tz(fecha, timeZone).isoWeekday();
        const horariosDia = await this.horarioService.findByDay(diaSemana);

        if (!horariosDia || horariosDia.length === 0) return [];

        const now = moment.tz(timeZone);
        const dayStart = moment.tz(fecha, timeZone).startOf('day').toDate();
        const dayEnd = moment.tz(fecha, timeZone).endOf('day').toDate();

        const pedidosExistentes = await this.pedidoRepository.find({
            where: {
                available: true,
                finalizado: false,
                espacio: { id: espacio.id },
                fecha_inicio: LessThanOrEqual(dayEnd),
                fecha_fin: MoreThanOrEqual(dayStart),
            },
            relations: { espacio: true },
        });

        const pedidosOrdenados = pedidosExistentes
            .map((p) => ({
                inicio: moment(p.fecha_inicio).tz(timeZone, true),
                fin: moment(p.fecha_fin).tz(timeZone, true),
            }))
            .sort((a, b) => a.inicio.valueOf() - b.inicio.valueOf());

        console.log('pedidosOrdenados', pedidosOrdenados);


        const disponibilidadRaw: { start: moment.Moment; end: moment.Moment }[] = [];

        for (const horario of horariosDia) {
            const apertura = moment.tz(`${fecha} ${horario.hora_inicio}`, fmt, timeZone);
            let cierre = moment.tz(`${fecha} ${horario.hora_fin}`, fmt, timeZone);
            if (!apertura.isValid() || !cierre.isValid()) continue;
            if (cierre.isBefore(apertura)) cierre.add(1, 'day');

            let actual: moment.Moment;
            if (withPast) {
                actual = apertura.clone();
            } else {
                const isToday = moment.tz(fecha, 'YYYY-MM-DD', timeZone).isSame(now, 'day');
                actual = isToday ? moment.max(apertura, now.clone()) : apertura.clone();
            }

            for (const pedido of pedidosOrdenados) {
                if (pedido.fin.isSameOrBefore(actual)) continue;
                if (pedido.inicio.isSameOrAfter(cierre)) break;

                if (pedido.inicio.isSameOrAfter(actual)) {
                    const huecoFin = moment.min(pedido.inicio, cierre);
                    if (huecoFin.isAfter(actual)) {
                        disponibilidadRaw.push({
                            start: actual.clone(),
                            end: huecoFin.clone().subtract(1, 'minute'),
                        });
                    }
                }

                if (pedido.fin.isAfter(actual)) actual = moment.max(actual, pedido.fin.clone());
                if (actual.isSameOrAfter(cierre)) break;
            }

            if (actual.isBefore(cierre)) {
                disponibilidadRaw.push({ start: actual.clone(), end: cierre.clone() });
            }
        }
        return disponibilidadRaw
            .filter(({ end }) => end.isAfter(now))
            .map(({ start, end }) =>
                `${start.tz(timeZone).format('YYYY-MM-DD HH:mm')} - ${end.tz(timeZone).format('YYYY-MM-DD HH:mm')}`
            );
    }

    async getNextDateTimeAvailableByEspacio(
        espacioId: number,
        timeZone: string = 'America/Montevideo',
        maxDays: number = 15,
    ): Promise<string> {
        try {
            const espacio = await this.espacioRepository.findOne({ where: { id: espacioId } });
            if (!espacio) throw new Error('Espacio no encontrado');

            const today = moment().tz(timeZone).format('YYYY-MM-DD');
            const fechaFin = moment(today).add(maxDays, 'days').format('YYYY-MM-DD');

            for (let i = 0; i <= maxDays; i++) {
                const fechaCheck = moment(today).add(i, 'days').format('YYYY-MM-DD');

                const disponibles = await this.calcularDisponibilidadEspacio(espacioId, fechaCheck);

                if (disponibles.length > 0) {
                    return disponibles[0];
                }
            }

            throw new Error(`No hay disponibilidades en los próximos ${maxDays} días para este espacio.`);
        } catch (error) {
            throw new BadRequestException({
                ok: false,
                statusCode: 400,
                message: error?.message || 'Error al obtener disponibilidad por espacio',
                error: 'Bad Request',
            });
        }
    }

    async getOrdersForCalendarByEspacio(
        dateTime: string,
        timeZone: string,
        espacio_id: number,
    ) {
        try {
            const now = getCurrentDate();
            const filterDate = moment(dateTime, 'YYYY-MM-DD').startOf('day');

            const filterDateStart = filterDate.startOf('day').toDate();
            const filterDateEnd = filterDate.endOf('day').toDate();

            const espacioExist = await this.espacioRepository.findOne({ where: { id: espacio_id } })


            const conditions: any = {
                where: {
                    available: true,
                    fecha: Between(filterDateStart, filterDateEnd),
                    espacio: { id: espacio_id },
                },
                order: { fecha: 'DESC' },
                relations: ['client', 'precio'],
            };

            const pedidos = await this.pedidoRepository.find(conditions);

            const dates = {};
            await Promise.all(
                pedidos.map(async (pedido) => {
                    const formattedDate = moment(pedido.fecha).format('YYYY-MM-DD');

                    const pedidoDate = moment.tz(pedido.fecha, timeZone);

                    const nowMoment = moment.tz(now, timeZone);

                    const isOlder = pedidoDate.isAfter(nowMoment);

                    const total =
                        (pedido.cantidad_espacio_precio ?? 0) *
                        (pedido.precio?.precio ?? 0);

                    const formatPedidoResponse = {
                        clientName: pedido.client?.nombre || 'Desconocido',
                        numberSender: pedido.client?.telefono || 'N/A',
                        orderId: pedido.id,
                        total: total || 0,
                        date: isOlder ? pedidoDate.format('LT') : pedidoDate.fromNow(),
                        fecha: pedido.fecha,
                        status: pedido.confirmado,
                        espacio: espacioExist ?? {},
                        precio: pedido.precio,
                        fecha_inicio: pedido.fecha_inicio,
                        fecha_fin: pedido.fecha_fin
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
                message: error?.message || 'Error al obtener pedidos',
                error: 'Bad Request',
            });
        }
    }

    async verificarDisponibilidadPorRangoYHora(
        espacioId: number,
        fechaInicio: string,
        cantidadDias: number,
        timeZone: string
    ): Promise<boolean> {
        const startDate = moment.tz(fechaInicio, timeZone);

        for (let i = 0; i < cantidadDias; i++) {
            const currentDate = startDate.clone().add(i, 'days');
            const diaSemana = currentDate.isoWeekday();
            const horariosDia = await this.horarioService.findByDay(diaSemana);

            if (!horariosDia || horariosDia.length === 0) {
                return false;
            }
        }

        const endDate = startDate.clone().add(cantidadDias, 'days');
        const pedidosExistentes = await this.pedidoRepository.find({
            where: {
                available: true,
                finalizado: false,
                espacio: { id: espacioId },
            },
        });

        for (const pedido of pedidosExistentes) {
            const pedidoInicio = moment(pedido.fecha_inicio);
            const pedidoFin = moment(pedido.fecha_fin);

            if (startDate.isBefore(pedidoFin) && endDate.isAfter(pedidoInicio)) {
                return false;
            }
        }

        return true;
    }



}