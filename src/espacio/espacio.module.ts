import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';
import { EspacioController } from './espacio.controller';
import { EspacioService } from './espacio.service';
import { Precio } from './entities/precio';
import { PrecioService } from './precio.service';
import { PrecioController } from './prrecio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Espacio, Precio])],
  controllers: [EspacioController, PrecioController],
  providers: [EspacioService, PrecioService],
  exports: [EspacioService],
})
export class EspacioModule {}

