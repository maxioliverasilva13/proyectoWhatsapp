import { Module } from '@nestjs/common';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { GrenApiController } from './GreenApi.controller';
import { GreenApiService } from './GreenApi.service';
import { ChatGptThreadsModule } from 'src/chatGptThreads/chatGptThreads.module';
import { PedidoModule } from 'src/pedido/pedido.module';
import { ClienteModule } from 'src/cliente/cliente.module';
import { ProductoModule } from 'src/producto/producto.module';

@Module({
  imports:[ ChatGptThreadsModule, PedidoModule, ClienteModule, ProductoModule],
  controllers: [GrenApiController],
  providers: [GreenApiService , TenantConnectionService],
  exports: [GreenApiService],
})
export class GreenApiModule {}
