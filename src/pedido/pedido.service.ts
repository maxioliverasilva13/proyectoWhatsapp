import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { ProductopedidoService } from 'src/productopedido/productopedido.service';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { ProductoService } from 'src/producto/producto.service';

@Injectable()
export class PedidoService {
  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(Estado)
    private estadoRepository: Repository<Estado>,
    private readonly productoPedidoService : ProductopedidoService,
    @InjectRepository(Producto)
    private readonly productoRespitory : Repository<Producto>
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
      newPedido.fecha = createPedidoDto.fecha? createPedidoDto.fecha : new Date()

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

  async consultarHorarioxd(hora, productId) {

    let date = new Date();
    let options = { timeZone: 'America/Montevideo' };
    let timeString = date.toLocaleString('en-US', options); 
    
    
    const nowUtc = new Date();
    const allServices = await this.pedidoRepository.find({
      relations: ['pedidosprod', 'pedidosprod.producto'],
    });
    
    let isAviable = true;
    const producto = await this.productoRespitory.findOne({where:{id:productId}})
    const duracionMinutos = producto.plazoDuracionEstimadoMinutos; 
    const horaFormated = new Date(hora);  
    const horaFinSolicitadad = new Date(horaFormated)
    horaFinSolicitadad.setMinutes(horaFinSolicitadad.getMinutes() + duracionMinutos)
    console.log(horaFinSolicitadad);
    

    for( const service of allServices ) {
      const fechaInicial = new Date(service.fecha);  
    
      for(const pedidoProd of service.pedidosprod ) {
        
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
      "ok":true,
      "services":allServices,
      "isAviable": isAviable
    }
  }

  findAll() {
    return `This action returns all pedido`;
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
