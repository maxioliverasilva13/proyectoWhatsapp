import { Module } from '@nestjs/common';
import { JsonWebTokenService } from './jwt.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports : [ ],
  providers: [JsonWebTokenService,JwtService],
  exports: [JsonWebTokenService]
})
export class JsonWebTokenModule {}
