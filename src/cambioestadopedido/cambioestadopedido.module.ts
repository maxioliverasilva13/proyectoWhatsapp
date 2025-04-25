import { Module } from '@nestjs/common';
import { CambioestadopedidoService } from './cambioestadopedido.service';
import { CambioestadopedidoController } from './cambioestadopedido.controller';
import { Cambioestadopedido } from './entities/cambioestadopedido.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from 'src/estado/entities/estado.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { SendMessageChangeStatusOrder } from './cambioestadopedido.processor';
import { BullModule } from '@nestjs/bullmq';
import { WebSocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cambioestadopedido, Estado, Pedido]),WebSocketModule, BullModule.registerQueue({
    name: `sendMessageChangeStatusOrder-${process.env.SUBDOMAIN}`,
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
  })],
  providers: [CambioestadopedidoService, SendMessageChangeStatusOrder],
  controllers: [CambioestadopedidoController],
})
export class CambioestadopedidoModule { }
