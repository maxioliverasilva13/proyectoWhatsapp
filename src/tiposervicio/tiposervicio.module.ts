import { Module } from '@nestjs/common';
import { TiposervicioService } from './tiposervicio.service';
import { TiposervicioController } from './tiposervicio.controller';

@Module({
  controllers: [TiposervicioController],
  providers: [TiposervicioService],
})
export class TiposervicioModule {}
