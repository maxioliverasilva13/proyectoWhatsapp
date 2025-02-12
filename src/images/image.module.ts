import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ImageService } from './image.service';
import { SupabaseService } from 'src/suprabase/suprabase.service';

@Module({
  controllers: [ImageController],
  providers: [ImageService, SupabaseService],
})
export class ImageModule {}
