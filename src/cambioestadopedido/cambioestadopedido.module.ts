import { Module } from '@nestjs/common';
import { CambioestadopedidoService } from './cambioestadopedido.service';
import { CambioestadopedidoController } from './cambioestadopedido.controller';
import { Cambioestadopedido } from './entities/cambioestadopedido.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from 'src/estado/entities/estado.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cambioestadopedido, Estado, Pedido, Usuario])],
  controllers: [CambioestadopedidoController],
  providers: [CambioestadopedidoService],
})
export class CambioestadopedidoModule {}
