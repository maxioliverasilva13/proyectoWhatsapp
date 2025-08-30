import { Module } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { Estado } from 'src/estado/entities/estado.entity';
import { ProductopedidoModule } from 'src/productopedido/productopedido.module';
import { Producto } from 'src/producto/entities/producto.entity';
import { Tiposervicio } from 'src/tiposervicio/entities/tiposervicio.entity';
import { ChatModule } from 'src/chat/chat.module';
import { MensajeModule } from 'src/mensaje/mensaje.module';
import { WebSocketModule } from 'src/websocket/websocket.module';
import { Chat } from 'src/chat/entities/chat.entity';
import { ProductoPedido } from 'src/productopedido/entities/productopedido.entity';
import { Cambioestadopedido } from 'src/cambioestadopedido/entities/cambioestadopedido.entity';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { Cliente } from 'src/cliente/entities/cliente.entity';
import { Category } from 'src/category/entities/category.entity';
import { BullModule } from '@nestjs/bullmq';
import { DeviceModule } from 'src/device/device.module';
import { Reclamo } from './entities/reclamo.entity';
import { PaymentMethod } from 'src/paymentMethod/entities/paymentMethod.entity';
import { HorarioModule } from 'src/horario/horario.module';
import { Espacio } from 'src/espacio/entities/espacio';
import { PedidoEspaciosService } from './pedidoEspacios.service';
import { Precio } from 'src/espacio/entities/precio';
import { PedidoEspacioController } from './pedidoEspacios.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      Estado,
      ProductoPedido,
      Category,
      Producto,
      PaymentMethod,
      Tiposervicio,
      Chat,
      ProductoPedido,
      Cambioestadopedido,
      Mensaje,
      Cliente,
      Reclamo,
      Espacio,
      Precio
    ]),
    ProductopedidoModule,
    DeviceModule,
    HorarioModule,
    ChatModule,
    MensajeModule,
    WebSocketModule,
    BullModule.registerQueue({
      name: `sendMessageChangeStatusOrder-${process.env.SUBDOMAIN}`,
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
  ],
  controllers: [PedidoController, PedidoEspacioController],
  providers: [PedidoService, PedidoEspaciosService],
  exports: [PedidoService, PedidoEspaciosService],
})
export class PedidoModule { }
