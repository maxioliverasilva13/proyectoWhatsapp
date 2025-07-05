import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuImageService } from './menuImg.service';
import { MenuImageController } from './menuImg.controller';
import { MenuImage } from './entities/menu';
import { OpenaiModule } from 'src/openAI/openAI.module';
import { GreenApiModule } from 'src/greenApi/GreenApi.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuImage]), OpenaiModule, forwardRef(()=> GreenApiModule)],
  providers: [MenuImageService],
  controllers: [MenuImageController],
  exports: [MenuImageService]
})
export class MenuImageModule {}