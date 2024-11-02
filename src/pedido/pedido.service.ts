import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { ProductopedidoService } from 'src/productopedido/productopedido.service';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    private readonly productoPedidoService : ProductopedidoService
  ) {}

  async create(createPedidoDto : CreatePedidoDto) {
    try {      
      const estado = await this.estadoRepository.findOne({where:{id:createPedidoDto.estadoId}})

      if(!estado) throw new BadRequestException("no existe un estado con ese id")

      const newPedido = new Pedido;

      newPedido.confirmado = createPedidoDto.confirmado
      newPedido.cliente_id = createPedidoDto.clienteId
      newPedido.estado = estado;
      newPedido.tipo_servicio_id = createPedidoDto.tipo_servicioId,

      await this.pedidoRepository.save(newPedido);

      // ahora creamoos los productos.servicio:
      await Promise.all(
        createPedidoDto.productos.map((prod) => 
          this.productoPedidoService.create({
            cantidad: prod.cantidad,
            productoId: prod.producto,
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

  findAll() {
    return `This action returns all pedido`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pedido`;
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    return `This action updates a #${id} pedido`;
  }

  remove(id: number) {
    return `This action removes a #${id} pedido`;
  }
}
