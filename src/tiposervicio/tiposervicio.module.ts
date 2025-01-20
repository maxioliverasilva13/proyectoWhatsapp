import { Module } from '@nestjs/common';
import { TiposervicioService } from './tiposervicio.service';
import { TiposervicioController } from './tiposervicio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tiposervicio } from './entities/tiposervicio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tiposervicio])],
  controllers: [TiposervicioController],
  providers: [TiposervicioService],
})
export class TiposervicioModule {}
