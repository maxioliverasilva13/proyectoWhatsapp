import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';
import { EspacioController } from './espacio.controller';
import { EspacioService } from './espacio.service';
import { Precio } from './entities/precio';

@Module({
  imports: [TypeOrmModule.forFeature([Espacio, Precio])],
  controllers: [EspacioController],
  providers: [EspacioService],
  exports: [EspacioService],
})
export class EspacioModule {}

