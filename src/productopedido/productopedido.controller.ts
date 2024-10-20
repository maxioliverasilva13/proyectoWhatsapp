import { Controller } from '@nestjs/common';
import { ProductopedidoService } from './productopedido.service';

@Controller('productopedido')
export class ProductopedidoController {
  constructor(private readonly productopedidoService: ProductopedidoService) {}
}
