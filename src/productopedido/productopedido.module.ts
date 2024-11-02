import { Module } from '@nestjs/common';
import { ProductopedidoService } from './productopedido.service';
import { ProductopedidoController } from './productopedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoPedido } from './entities/productopedido.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductoPedido])
  ],  
  controllers: [ProductopedidoController],
  providers: [ProductopedidoService],
  exports:[ProductopedidoService]
})
export class ProductopedidoModule {}
