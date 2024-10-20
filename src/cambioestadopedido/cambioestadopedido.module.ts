import { Module } from '@nestjs/common';
import { CambioestadopedidoService } from './cambioestadopedido.service';
import { CambioestadopedidoController } from './cambioestadopedido.controller';

@Module({
  controllers: [CambioestadopedidoController],
  providers: [CambioestadopedidoService],
})
export class CambioestadopedidoModule {}
