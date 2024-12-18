import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './entities/chat.entity';
import { Pedido } from 'src/pedido/entities/pedido.entity';


@Injectable()
export class ChatService {

  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>
  ) { }

  async create(createChatDto: CreateChatDto) {
    try {
      const pedidoExist = await this.pedidoRepository.findOne({
        where: { id: createChatDto.pedidoId },
        relations: ['chat'],
      });

      if (!pedidoExist) {
        throw new BadRequestException('No existe pedido con ese id');
      }

      if (pedidoExist.chat) {
        throw new BadRequestException('El pedido ya tiene un chat asociado');
      }
      const newChat = new Chat();
      newChat.pedido = pedidoExist; 

      const savedChat = await this.chatRepository.save(newChat);

      return {
        ok: true,
        statusCode: 200,
        message: 'Chat creado exitosamente',
        data: savedChat,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error al crear el chat',
        error: 'Bad Request',
      });
    }
  }



  findAll() {
    const allChats = this.chatRepository.find()
    return {
      ok: true,
      statusCode: 200,
      data: allChats
    }
  }

  async findOne(id: number) {
    try {
      const chat = await this.chatRepository.findOne({ where: { id } })
      if (!chat) {
        throw new BadRequestException('no existe pedido con ese id')
      }

      return {
        ok: true,
        statusCode: 200,
        data: chat
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  update(id: number, updateChatDto: UpdateChatDto) {
    return `This action updates a #${id} chat`;
  }

  async remove(id: number) {
    try {
      const chat = await this.chatRepository.findOne({ where: { id } })
      if (!chat) {
        throw new BadRequestException('no existe pedido con ese id')
      }

      const res = await this.chatRepository.delete(chat)

      if (res.affected === 0) {
        throw new BadRequestException('error al borrar el chat')
      }

      return {
        ok: true,
        statusCode: 200,
        message: 'chat eliminado exitosamente'
      }

    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }
}
