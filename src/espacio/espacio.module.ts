import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Espacio } from './entities/espacio';
import { EspacioController } from './espacio.controller';
import { EspacioService } from './espacio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Espacio])],
  controllers: [EspacioController],
  providers: [EspacioService],
  exports: [EspacioService],
})
export class EspacioModule {}

