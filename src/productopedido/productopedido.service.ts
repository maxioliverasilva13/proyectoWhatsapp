import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductoPedido } from './entities/productopedido.entity';
import { Repository } from 'typeorm';
import { ProductoPedidoDto } from './dto/productoPedidoDto';

@Injectable()
export class ProductopedidoService {
    constructor(
        @InjectRepository(ProductoPedido)
        private productoPedido: Repository<ProductoPedido>
    ) {}
    
    async create(productoPedidoDto : ProductoPedidoDto) {
        try {
            const pedido = new ProductoPedido;
            pedido.pedidoId = productoPedidoDto.pedidoId;
            pedido.productoId = productoPedidoDto.productoId;
            pedido.cantidad = productoPedidoDto.cantidad;
            pedido.detalle = productoPedidoDto.detalle;
            pedido.infoLinesJson = productoPedidoDto.infoLinesJson

            await this.productoPedido.save(pedido)

            return {
                ok:true,
                statusCode: 200,
                message:"producto agregado al pedido",
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

}
