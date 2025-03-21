import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Importa ConfigModule
import { handleGetConnection } from './utils/dbConnection';
import { EmpresaController } from './empresa/empresa.controller';
import {
  AppWithoutSubdomainMiddleware,
  SubdomainMiddleware,
} from "./middleware/subdomain.middleware";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { EmpresaModule } from "./empresa/empresa.module";
import { ProductoModule } from "./producto/producto.module";
import { ProductoController } from "./producto/producto.controller";
import { PedidoModule } from "./pedido/pedido.module";
import { ChatModule } from "./chat/chat.module";
import { MensajeModule } from "./mensaje/mensaje.module";
import { EstadoModule } from "./estado/estado.module";
import { CambioestadopedidoModule } from "./cambioestadopedido/cambioestadopedido.module";
import { UsuarioModule } from "./usuario/usuario.module";
import { ClienteModule } from "./cliente/cliente.module";
import { RolesModule } from "./roles/roles.module";
import { PlanModule } from "./plan/plan.module";
import { TiposervicioModule } from "./tiposervicio/tiposervicio.module";
import { ProductopedidoModule } from "./productopedido/productopedido.module";
import { GreenApiModule } from "./greenApi/GreenApi.module";
import { ChatGptThreadsModule } from "./chatGptThreads/chatGptThreads.module";
import { GrenApiController } from "./greenApi/GreenApi.controller";
import { NumeroConfianzaModule } from "./numerosConfianza/numeroConfianza.module";
import { NumeroConfianzaController } from "./numerosConfianza/numeroConfianza.controller";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { JwtMiddleware } from "./middleware/jwt.middleware";
import { AuthController } from "./auth/auth.controller";
import { CierreProvisorioModule } from "./cierreProvisorio/cierreProvisorio.module";
import { EmailQueueModule } from "./emailqueue/emailqueue.module";
import { EmailModule } from "./emailqueue/nodemailer.module";
import { BullModule } from "@nestjs/bull";
import { PlanEmpresaModule } from "./planEmpresa/planEmpresa.module";
import { EmailCOntroller } from './emailqueue/email.controller';
import { EmailService } from './emailqueue/email.service';
import { InfolineModule } from './infoline/infoline.module';
import { WebSocketModule } from './websocket/websocket.module';
import { PedidoController } from './pedido/pedido.controller';
import { InfolineController } from './infoline/infoline.controller';
import { ChatGptThreadsController } from './chatGptThreads/chatGptThreads.controller';
import { MensajeController } from './mensaje/mensaje.controller';
import { ImageModule } from './images/image.module';
import { ImageController } from './images/image.controller';

ConfigModule.forRoot();

const connection = handleGetConnection();
@Module({
  imports: [
    connection,
    ...(process.env.SUBDOMAIN === 'app'
      ? [
          BullModule.forRoot({
            redis: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            },
          }),
          EmailModule,
          EmailQueueModule,
        ]
      : [
        WebSocketModule
      ]),
    ScheduleModule.forRoot(),
    EmpresaModule,
    ProductoModule,
    PedidoModule,
    ChatModule,
    MensajeModule,
    EstadoModule,
    CambioestadopedidoModule,
    UsuarioModule,
    ClienteModule,
    RolesModule,
    PlanModule,
    TiposervicioModule,
    ProductopedidoModule,
    GreenApiModule,
    ChatGptThreadsModule,
    NumeroConfianzaModule,
    AuthModule,
    CierreProvisorioModule,
    PlanEmpresaModule,
    InfolineModule,
    ImageModule
  ],
  controllers: [
    AppController,
    ...(process.env.SUBDOMAIN === 'app' ? [EmailCOntroller] : []),
  ],
  providers: [
    AppService,
    ...(process.env.SUBDOMAIN === 'app' ? [EmailService] : []),
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // APP ROUTES
    consumer
      .apply(AppWithoutSubdomainMiddleware)
      .forRoutes(EmpresaController, AuthController, ImageController);

    // EMPRESA ROUTES
    consumer
      .apply(SubdomainMiddleware)
      .forRoutes(
        ProductoController,
        GrenApiController,
        NumeroConfianzaController,
        PedidoController,
        InfolineController,
        ChatGptThreadsController,
        MensajeController
      );

    //JWT MIDDLEWARE
    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: '/empresa/info/getInfoByDomain', method: RequestMethod.ALL },
        { path: '/auth/login', method: RequestMethod.ALL },
        { path: '/auth/register', method: RequestMethod.ALL },
        { path: '/webhooks', method: RequestMethod.ALL },
        { path: '/tiposervicio', method: RequestMethod.ALL },
        { path: '/empresa', method: RequestMethod.ALL },
        { path: '/upload', method: RequestMethod.ALL },
        { path: '/upload/image', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
