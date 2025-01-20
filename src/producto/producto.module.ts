import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, ProductoPedido])],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService, TypeOrmModule],
})
export class ProductoModule {}

