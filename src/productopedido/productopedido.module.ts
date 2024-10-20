import { Module } from '@nestjs/common';
import { ProductopedidoService } from './productopedido.service';
import { ProductopedidoController } from './productopedido.controller';

@Module({
  controllers: [ProductopedidoController],
  providers: [ProductopedidoService],
})
export class ProductopedidoModule {}
