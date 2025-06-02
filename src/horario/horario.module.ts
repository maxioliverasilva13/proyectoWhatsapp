import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Horario } from './entities/horario.entity';
import { HorarioService } from './horario.service';
import { HorarioController } from './horario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Horario])],
  providers: [HorarioService],
  controllers: [HorarioController],
  exports: [HorarioService]
})
export class HorarioModule {}
