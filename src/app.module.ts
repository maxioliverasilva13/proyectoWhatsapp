import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'; // <--- Importa ConfigModule
import { EmpresaModule } from './empresa/empresa.module';
import { ProductoController } from './producto/producto.controller';
import { ProductoService } from './producto/producto.service';
import { handleGetConnection } from './utils/dbConnection';
import { TenantConnectionModule } from './tenant-connection-service/tenant-connection-service.module';
import { EmpresaController } from './empresa/empresa.controller';
import {
  AppWithoutSubdomainMiddleware,
  SubdomainMiddleware,
} from './middleware/subdomain.middleware';
import { AppController } from './app.controller';
import { UsuarioModule } from './usuario/usuario.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JsonWebTokenService } from './jwt/jwt.service';

ConfigModule.forRoot();

@Module({
  imports: [handleGetConnection(), 
    EmpresaModule, 
    TenantConnectionModule, 
    UsuarioModule, 
    AuthModule,
    JwtModule.register({
      global: true,
      secret:  process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }) 
  ],
  controllers: [ProductoController, EmpresaController],
  providers: [AppService, ProductoService,JsonWebTokenService],
})
export class AppModule {
  // Se aplica el midelware para que los controladores de la base general , funcinenen solo con el subdominio `app`
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppWithoutSubdomainMiddleware)
      .forRoutes(AppController, EmpresaController);

    consumer.apply(SubdomainMiddleware).forRoutes(ProductoController);
  }
}
