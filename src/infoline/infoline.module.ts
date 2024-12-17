import { Module } from '@nestjs/common';
import { InfolineService } from './infoline.service';
import { InfolineController } from './infoline.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Infoline } from './entities/infoline.entity';
import { TiposervicioService } from 'src/tiposervicio/tiposervicio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Infoline, TiposervicioService])],
  controllers: [InfolineController],
  providers: [InfolineService],
  exports:[InfolineService]
})
export class InfolineModule {}