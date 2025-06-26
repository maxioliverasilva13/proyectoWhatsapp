import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuImageService } from './menuImg.service';
import { MenuImageController } from './menuImg.controller';
import { MenuImage } from './entities/menu';

@Module({
  imports: [TypeOrmModule.forFeature([MenuImage])],
  providers: [MenuImageService],
  controllers: [MenuImageController],
})
export class MenuImageModule {}