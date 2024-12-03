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

@Injectable()
export class PedidoService {
  private tipoServicioRepository : Repository<Tiposervicio>

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    private readonly productoPedidoService: ProductopedidoService,
    @InjectRepository(Producto)
    private readonly productoRespitory: Repository<Producto>,
  ) { }

  async onModuleInit() {
    const globalConnection = await handleGetGlobalConnection();
    this.tipoServicioRepository = globalConnection.getRepository(Tiposervicio);
  }

  async create(createPedidoDto: CreatePedidoDto) {
    try {
      const estado = await this.estadoRepository.findOne({ where: { id: createPedidoDto.estadoId } })

      if (!estado) throw new BadRequestException("no existe un estado con ese id")

      const newPedido = new Pedido;

      newPedido.confirmado = createPedidoDto.confirmado
      newPedido.cliente_id = createPedidoDto.clienteId
      newPedido.estado = estado;
      newPedido.tipo_servicio_id = createPedidoDto.tipo_servicioId,
        newPedido.fecha = createPedidoDto.fecha ? createPedidoDto.fecha : new Date()
      newPedido.infoLinesJson = createPedidoDto.responseJSON

      await this.pedidoRepository.save(newPedido);

      // ahora creamoos los productos.servicio:
      await Promise.all(
        createPedidoDto.products.map((prod) =>
          this.productoPedidoService.create({
            cantidad: prod.cantidad,
            productoId: prod.productoId,
            pedidoId: newPedido.id,
            detalle: prod.detalle,
          })
        )
      );

      return {
        statusCode: 200,
        ok: true,
        message: 'Pedido creado exitosamente',
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

  async consultarHorario(hora, productos) {
    const allServices = await this.pedidoRepository.find({
      relations: ['pedidosprod', 'pedidosprod.producto'],
    });

    let duracionMinutos;
    let isAviable = true;
    productos.map(async (prod) => {
      const producto = await this.productoRespitory.findOne({ where: { id: prod.id } })
      duracionMinutos += producto.plazoDuracionEstimadoMinutos;
    })
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
      "ok": true,
      "services": allServices,
      "isAviable": isAviable
    }
  }

  async findAll(empresaType) {
    try {      
      const tipoServicio = await this.tipoServicioRepository.findOne({where:{tipo:empresaType}})      

      const pedidos = await this.pedidoRepository.find({where:{tipo_servicio_id:tipoServicio.id}})

      return {
        ok:true,
        statusCode:200,
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

  findOne(id: number) {
    return `This action returns a #${id} pedido 1`;
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    return `This action updates a #${id} pedido 2`;
  }

  remove(id: number) {
    return `This action removes a #${id} pedido 3`;
  }
}
