import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BcryptModule } from 'src/bcrypt/bcrypt.module';
import { JsonWebTokenModule} from 'src/jwt/jwt.module';
import { TenantConnectionModule } from 'src/tenant-connection-service/tenant-connection-service.module';
import { AuthGuard } from './auth.guard';


@Module({
  imports: [
    BcryptModule, 
    TenantConnectionModule,
    JsonWebTokenModule 
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
})
export class AuthModule {}
