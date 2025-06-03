import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensaje } from './entities/mensaje.entity';
import { Chat } from 'src/chat/entities/chat.entity';
import { CreateMensajeToolDto } from './dto/create-mensajeTool.dto';
import { CreateMensajeToolsCallsDto } from './dto/create-mensajeToolsCalls';

@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Mensaje)
    private mensajeRepository: Repository<Mensaje>
  ) { }

  async create(createMensajeDto: CreateMensajeDto) {
    try {
      const chatExist = await this.chatRepository.findOne({ where: { id: createMensajeDto.chat } })
      if (!chatExist) {
        throw new BadRequestException('No existe chat con ese id')
      }

      const newMessage = new Mensaje()
      newMessage.chat = chatExist,
        newMessage.isClient = createMensajeDto.isClient,
        newMessage.mensaje = createMensajeDto.mensaje

      await this.mensajeRepository.save(newMessage)

      return {
        ok: true,
        statusCode: 200,
        message: 'mensaje creado exitosamente'
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

  async createToolMessage(createMensajeDto: CreateMensajeToolDto) {
    try {
      const chatExist = await this.chatRepository.findOne({ where: { id: createMensajeDto.chat } })
      if (!chatExist) {
        throw new BadRequestException('No existe chat con ese id')
      }

      const newMessage = new Mensaje()
      newMessage.chat = chatExist,
        newMessage.isClient = false,
        newMessage.isTool = true,
        newMessage.tool_call_id = createMensajeDto.toolCallId,
        newMessage.mensaje = createMensajeDto.mensaje,

        await this.mensajeRepository.save(newMessage)

      return {
        ok: true,
        statusCode: 200,
        message: 'mensaje creado exitosamente'
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

  async createToolCallsMessage(createMensajeDto: CreateMensajeToolsCallsDto) {
    try {
      const chatExist = await this.chatRepository.findOne({ where: { id: createMensajeDto.chat } })
      if (!chatExist) {
        throw new BadRequestException('No existe chat con ese id')
      }

      const newMessage = new Mensaje()
      newMessage.chat = chatExist,
        newMessage.isClient = false,
        newMessage.isTool = true,
        newMessage.tool_calls = createMensajeDto.tool_calls,
        await this.mensajeRepository.save(newMessage)

      return {
        ok: true,
        statusCode: 200,
        message: 'mensaje creado exitosamente'
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

  async findAll(chatId: number) {
    try {
      const mensajes = await this.mensajeRepository.find({ where: { chat: { id: chatId }, isTool: false } })
      if (!mensajes) {
        throw new BadRequestException('el chat no existe')
      }

      return {
        ok: true,
        statusCode: 200,
        data: mensajes
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

  async findOne(id: number) {
    try {
      const mensaje = await this.mensajeRepository.findOne({ where: { id: id } })
      if (!mensaje) {
        throw new BadRequestException('no existe un mensaje con ese id')
      }

      return {
        ok: true,
        statusCode: 200,
        data: mensaje
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

  async update(id: number, updateMensajeDto: UpdateMensajeDto) {
    try {
      const mensaje = await this.mensajeRepository.findOne({ where: { id: id } })

      if (!mensaje) {
        throw new BadRequestException('no existe un mensaje con ese id')
      }

      if (!updateMensajeDto.mensaje || updateMensajeDto.mensaje.trim() === '') {
        throw new BadRequestException('el contenido del mensaje no puede estar vacío');
      }

      mensaje.mensaje = updateMensajeDto.mensaje

      await this.mensajeRepository.save(mensaje)

      return {
        ok: true,
        statusCode: 200,
        message: 'mensaje actualizado exitosamente',
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

  async remove(id: number) {
    try {
      const mensaje = await this.mensajeRepository.findOne({ where: { id: id } })

      if (!mensaje) {
        throw new BadRequestException('no existe un mensaje con ese id')
      }

      const res = await this.mensajeRepository.delete(mensaje)

      if (res.affected === 0) {
        throw new BadRequestException('error al borrar el mensaje')
      }

      return {
        ok: true,
        statusCode: 200,
        message: 'mensaje eliminado exitosamente'
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
