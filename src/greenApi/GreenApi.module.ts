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
import { GreenApiRetirveMessage } from './GreenApi.processor';
import { BullModule } from '@nestjs/bullmq';
import { EmpresaModule } from 'src/empresa/empresa.module';
import { DeviceModule } from 'src/device/device.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { Chat } from 'src/chat/entities/chat.entity';

@Module({
  imports:[ TypeOrmModule.forFeature([Chat, Mensaje]),ChatGptThreadsModule, PedidoModule, DeviceModule, ClienteModule, ProductoModule,EmpresaModule, NumeroConfianzaModule, WebSocketModule, InfolineModule, MensajeModule, ChatModule, BullModule.registerQueue({
    name:`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`,
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
    },
  }),],
  controllers: [GrenApiController],
  providers: [GreenApiService , TenantConnectionService, GreenApiRetirveMessage],
  exports: [GreenApiService],
})
export class GreenApiModule {}
