import { Module } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { ProductopedidoModule } from 'src/productopedido/productopedido.module';
import { Producto } from 'src/producto/entities/producto.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Estado, Producto, Tiposervicio]),ProductopedidoModule
  ],  
  controllers: [PedidoController],
  providers: [PedidoService],
  exports:[PedidoService]
})
export class PedidoModule {}
