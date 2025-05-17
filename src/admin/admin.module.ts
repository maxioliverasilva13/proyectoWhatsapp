import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Empresa, Usuario])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
