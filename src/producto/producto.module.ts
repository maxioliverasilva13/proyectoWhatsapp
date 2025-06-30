import { Module } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './entities/producto.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Category } from 'src/category/entities/category.entity';
import { MenuImage } from 'src/menuImg/entities/menu';
import { GreenApiModule } from 'src/greenApi/GreenApi.module';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, ProductoPedido, Category, MenuImage]), GreenApiModule],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService, TypeOrmModule],
})
export class ProductoModule {}

