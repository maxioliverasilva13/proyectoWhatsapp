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
ConfigModule.forRoot();

console.log("xd")

const connection = handleGetConnection();
@Module({
  imports: [connection, EmpresaModule, ProductoModule],
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
