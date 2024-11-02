import { Body, Controller, Post } from '@nestjs/common';
import { ProductopedidoService } from './productopedido.service';
import { ProductoPedidoDto } from './dto/productoPedidoDto';

@Controller('productopedido')
export class ProductopedidoController {
  constructor(private readonly productopedidoService: ProductopedidoService) {}

  @Post()
  async create(@Body() prodPedidoDto : ProductoPedidoDto) {
    return this.productopedidoService.create(prodPedidoDto)
  }
}
