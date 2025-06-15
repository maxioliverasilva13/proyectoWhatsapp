import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { Producto } from 'src/producto/entities/producto.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Category } from 'src/category/entities/category.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import { SeedService } from './fakeseed.service';
import { handleGetConnection } from 'src/utils/dbConnection';

const connection = handleGetConnection();

@Module({
  imports: [
    connection,
    TypeOrmModule.forFeature([Pedido, Producto, ProductoPedido, Category, Chat, Cliente]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
