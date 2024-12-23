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

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedido, Estado, Producto, Tiposervicio, Chat, ProductoPedido, Cambioestadopedido, Mensaje]),ProductopedidoModule, ChatModule, MensajeModule, WebSocketModule],  
  controllers: [PedidoController],
  providers: [PedidoService],
  exports:[PedidoService]
})
export class PedidoModule {}
