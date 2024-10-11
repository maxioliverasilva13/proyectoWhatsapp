import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BcryptModule } from 'src/bcrypt/bcrypt.module';
import { JwtModule } from 'src/jwt/jwt.module';
import { TenantConnectionModule } from 'src/tenant-connection-service/tenant-connection-service.module';

@Module({
  imports: [BcryptModule, JwtModule, TenantConnectionModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
