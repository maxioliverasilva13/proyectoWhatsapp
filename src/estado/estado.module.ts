import { Module } from '@nestjs/common';
import { EstadoService } from './estado.service';
import { EstadoController } from './estado.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Estado } from './entities/estado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Estado])],
  controllers: [EstadoController],
  providers: [EstadoService],
})
export class EstadoModule {}
