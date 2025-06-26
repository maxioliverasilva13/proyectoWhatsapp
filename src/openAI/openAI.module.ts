import { Module } from '@nestjs/common';
import { OpenaiService } from './openAI.service';
import { OpenaiController } from './openAI.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/category/entities/category.entity';

@Module({
    imports: [ TypeOrmModule.forFeature([Category])],
  controllers: [OpenaiController],
  providers: [OpenaiService],
  exports: [OpenaiService]
})
export class OpenaiModule {}
