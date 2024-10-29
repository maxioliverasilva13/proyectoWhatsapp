import { Module } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Estado]),
  ],  
  controllers: [PedidoController],
  providers: [PedidoService],
  exports:[PedidoService]
})
export class PedidoModule {}
