import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Importa ConfigModule
import { handleGetConnection } from './utils/dbConnection';
import { EmpresaController } from './empresa/empresa.controller';
import { AppWithoutSubdomainMiddleware, SubdomainMiddleware } from './middleware/subdomain.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmpresaModule } from './empresa/empresa.module';
import { ProductoModule } from './producto/producto.module';
import { ProductoController } from './producto/producto.controller';
import { PedidoModule } from './pedido/pedido.module';
import { ChatModule } from './chat/chat.module';
import { MensajeModule } from './mensaje/mensaje.module';
import { EstadoModule } from './estado/estado.module';
import { CambioestadopedidoModule } from './cambioestadopedido/cambioestadopedido.module';
import { UsuarioModule } from './usuario/usuario.module';
import { ClienteModule } from './cliente/cliente.module';
import { RolesModule } from './roles/roles.module';
import { PlanModule } from './plan/plan.module';
import { TiposervicioModule } from './tiposervicio/tiposervicio.module';
import { ProductopedidoModule } from './productopedido/productopedido.module';
import { GreenApiModule } from './greenApi/GreenApi.module';
import { ChatGptThreadsModule } from './chatGptThreads/chatGptThreads.module';

ConfigModule.forRoot();

console.log(process.env.GREEN_API_TOKEN);

const connection = handleGetConnection();
@Module({
  imports: [connection, EmpresaModule, ProductoModule, PedidoModule, ChatModule, MensajeModule, EstadoModule, CambioestadopedidoModule, UsuarioModule, ClienteModule, RolesModule, PlanModule, TiposervicioModule, ProductopedidoModule, GreenApiModule, ChatGptThreadsModule ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
  // Se aplica el midelware para que los controladores de la base general , funcinenen solo con el subdominio `app`
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppWithoutSubdomainMiddleware).forRoutes(EmpresaController);
    consumer.apply(SubdomainMiddleware).forRoutes(ProductoController);
  }
}
