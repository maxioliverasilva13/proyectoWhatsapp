import { Module } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { Chat } from 'src/chat/entities/chat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, Mensaje])],
  controllers: [MensajeController],
  providers: [MensajeService],
  exports : [MensajeService]
})
export class MensajeModule {}
