import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
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
import { GrenApiController } from './greenApi/GreenApi.controller';
import { NumeroConfianzaModule } from './numerosConfianza/numeroConfianza.module';
import { NumeroConfianzaController } from './numerosConfianza/numeroConfianza.controller';
import { AuthModule } from './auth/auth.module';
import { JwtMiddleware } from './middleware/jwt.middleware';
import { AuthController } from './auth/auth.controller';

ConfigModule.forRoot();

const connection = handleGetConnection();
@Module({
  imports: [connection, EmpresaModule, ProductoModule, PedidoModule, ChatModule, MensajeModule, EstadoModule, CambioestadopedidoModule, UsuarioModule, ClienteModule, RolesModule, PlanModule, TiposervicioModule, ProductopedidoModule, GreenApiModule, ChatGptThreadsModule,NumeroConfianzaModule, AuthModule ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // APP ROUTES
    consumer.apply(AppWithoutSubdomainMiddleware)
    .exclude(
      { path: '/auth/me', method: RequestMethod.ALL }
    )
    .forRoutes(EmpresaController, AuthController);

    // EMPRESA ROUTES
    consumer.apply(SubdomainMiddleware)
    .forRoutes(ProductoController, GrenApiController, NumeroConfianzaController, { path: "/auth/me", method: RequestMethod.ALL });

    //JWT MIDDLEWARE
    consumer
    .apply(JwtMiddleware)
    .exclude(
      { path: '/auth/login', method: RequestMethod.ALL },
      { path: '/auth/register', method: RequestMethod.ALL },
      { path: '/webhooks', method: RequestMethod.ALL },
    )
    .forRoutes('*');
  }
}
