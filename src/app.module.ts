import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // <--- Importa ConfigModule
import { handleGetConnection } from './utils/dbConnection';
import { EmpresaController } from './empresa/empresa.controller';
import {
  AppWithoutSubdomainMiddleware,
  SubdomainMiddleware,
} from './middleware/subdomain.middleware';
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
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { JwtMiddleware } from './middleware/jwt.middleware';
import { AuthController } from './auth/auth.controller';
import { CierreProvisorioModule } from './cierreProvisorio/cierreProvisorio.module';
import { EmailQueueModule } from './emailqueue/emailqueue.module';
import { EmailModule } from './emailqueue/nodemailer.module';
import { BullModule } from '@nestjs/bullmq';
import { PlanEmpresaModule } from './planEmpresa/planEmpresa.module';
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
import { CategoryController } from './category/category.controller';
import { CategoryModule } from './category/category.module';
import { DeviceModule } from './device/device.module';
import { DeviceController } from './device/device.controller';
import { PaymentsModule } from './payments/payments.module';
import { AdminController } from './admin/admin.controller';
import { AdminModule } from './admin/admin.module';
import { PaymentMethodModule } from './paymentMethod/paymentMethod.module';
import { PaymentMethodController } from './paymentMethod/paymentMethod.controller';
import { HorarioController } from './horario/horario.controller';
import { HorarioModule } from './horario/horario.module';
import { ClienteController } from './cliente/cliente.controller';
import { OpenaiController } from './openAI/openAI.controller';
import { OpenaiModule } from './openAI/openAI.module';
import { MenuImageModule } from './menuImg/menuImg.module';
import { MenuImageController } from './menuImg/menuImg.controller';
import { EspacioModule } from './espacio/espacio.module';
import { EspacioController } from './espacio/espacio.controller';

ConfigModule.forRoot();

const connection = handleGetConnection();
@Module({
  imports: [
    connection,
    ...(process.env.SUBDOMAIN === 'app' ? [] : [WebSocketModule]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || '',
      },
      defaultJobOptions: {
        priority: 1,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
    EmailModule,
    EmailQueueModule,
    ScheduleModule.forRoot(),
    EmpresaModule,
    BullModule.registerQueue({
      name: `GreenApiResponseMessagee-${process.env.SUBDOMAIN}`,
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || '',
      },
    }),
    ProductoModule,
    PedidoModule,
    OpenaiModule,
    ChatModule,
    MensajeModule,
    EstadoModule,
    CambioestadopedidoModule,
    UsuarioModule,
    AdminModule,
    ClienteModule,
    RolesModule,
    PlanModule,
    TiposervicioModule,
    ProductopedidoModule,
    GreenApiModule,
    ChatGptThreadsModule,
    NumeroConfianzaModule,
    PaymentMethodModule,
    EspacioModule,
    AuthModule,
    CierreProvisorioModule,
    PlanEmpresaModule,
    InfolineModule,
    ImageModule,
    CategoryModule,
    DeviceModule,
    HorarioModule,
    PaymentsModule,
    PaymentsModule,
    MenuImageModule
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
      .forRoutes(
        EmpresaController,
        AdminController,
        AuthController,
        ImageController,
        DeviceController,
        NumeroConfianzaController,
      );

    // EMPRESA ROUTES
    consumer
      .apply(SubdomainMiddleware)
      .forRoutes(
        ProductoController,
        GrenApiController,
        PedidoController,
        InfolineController,
        EspacioController,
        ChatGptThreadsController,
        HorarioController,
        MensajeController,
        CategoryController,
        PaymentMethodController,
        ClienteController,
        OpenaiController,
        MenuImageController
      );

    //JWT MIDDLEWARE
    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: '/empresa/info/getInfoByDomain', method: RequestMethod.ALL },
        { path: '/auth/login', method: RequestMethod.ALL },
        { path: '/auth/register', method: RequestMethod.ALL },
        { path: '/webhooks', method: RequestMethod.ALL },
        { path: '/payments/verify', method: RequestMethod.ALL },
        { path: '/payments/verify/', method: RequestMethod.ALL },
        { path: '/tiposervicio', method: RequestMethod.ALL },
        { path: '/empresa', method: RequestMethod.ALL },
        { path: '/upload', method: RequestMethod.ALL },
        { path: '/upload/image', method: RequestMethod.ALL },
        { path: "auth/sendLinkToGmail", method: RequestMethod.ALL },
        { path: "auth/open-reset-link", method: RequestMethod.ALL },
        { path: "/pedido/calendar/next-date-avaiable", method: RequestMethod.ALL },
        { path: "/pedido/calendar/dates-avaiable", method: RequestMethod.ALL },
        { path: "/pedido/calendar/dates-avaiable-by-month", method: RequestMethod.GET },
        { path: "/horario", method: RequestMethod.GET },
        { path: "/usuario/workers/:empresaId", method: RequestMethod.GET },
        { path: "/usuario/workers", method: RequestMethod.GET },
        { path: "/payment-methods", method: RequestMethod.GET },
        { path: "/plan", method: RequestMethod.GET },
        { path: "/espacios", method: RequestMethod.GET}
      )
      .forRoutes('*');
  }
}




