import { Module } from '@nestjs/common';
import { ChatGptThreadsController } from './chatGptThreads.controller';
import { ChatGptThreadsService } from './chatGptThreads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantConnectionService } from 'src/tenant-connection-service/tenant-connection-service.service';
import { ChatGptThreads } from './entities/chatGpThreads.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatGptThreads])],
  controllers: [ChatGptThreadsController],
  providers: [ChatGptThreadsService,TenantConnectionService],
  exports: [ChatGptThreadsService],
})

export class ChatGptThreadsModule {}
