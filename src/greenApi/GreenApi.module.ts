import { Module } from '@nestjs/common';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { GrenApiController } from './GreenApi.controller';
import { GreenApiService } from './GreenApi.service';
import { ChatGptThreadsModule } from 'src/chatGptThreads/chatGptThreads.module';
import { PedidoModule } from 'src/pedido/pedido.module';
import { ClienteModule } from 'src/cliente/cliente.module';
import { ProductoModule } from 'src/producto/producto.module';
import { NumeroConfianzaModule } from 'src/numerosConfianza/numeroConfianza.module';
import { WebSocketModule } from 'src/websocket/websocket.module';
import { InfolineModule } from 'src/infoline/infoline.module';
import { MensajeModule } from 'src/mensaje/mensaje.module';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports:[ChatGptThreadsModule, PedidoModule, ClienteModule, ProductoModule, NumeroConfianzaModule, WebSocketModule, InfolineModule, MensajeModule, ChatModule],
  controllers: [GrenApiController],
  providers: [GreenApiService , TenantConnectionService],
  exports: [GreenApiService],
})
export class GreenApiModule {}
