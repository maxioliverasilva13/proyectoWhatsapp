import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuImageService } from './menuImg.service';
import { MenuImageController } from './menuImg.controller';
import { MenuImage } from './entities/menu';
import { OpenaiModule } from 'src/openAI/openAI.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuImage]), OpenaiModule],
  providers: [MenuImageService],
  controllers: [MenuImageController],
})
export class MenuImageModule {}