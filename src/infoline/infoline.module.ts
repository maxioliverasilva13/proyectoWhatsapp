import { Module } from '@nestjs/common';
import { InfolineService } from './infoline.service';
import { InfolineController } from './infoline.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Infoline } from './entities/infoline.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Infoline])],
  controllers: [InfolineController],
  providers: [InfolineService],
})
export class InfolineModule {}
