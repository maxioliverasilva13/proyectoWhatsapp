import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatGptThreads } from './entities/chatGpThreads.entity';
import * as moment from 'moment-timezone';
import { Chat } from 'src/chat/entities/chat.entity';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { chat } from 'googleapis/build/src/apis/chat';

@Injectable()
export class ChatGptThreadsService {
  constructor(
    @InjectRepository(ChatGptThreads)
    private threadsRepository: Repository<ChatGptThreads>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Mensaje)
    private messageRepository: Repository<Mensaje>,
  ) { }

  async getLastThreads(numberPhone) {
    try {
      let originalChatId: any = null;
      const lastThread = await this.threadsRepository.findOne({
        where: { numberPhone: numberPhone },
        order: { id: 'DESC' },
      });

      if (lastThread) {
        if (lastThread.originalChatId) {
          originalChatId = lastThread.originalChatId;
        } else {
          const newChat = await this.chatRepository.save({
            chatIdExternal: lastThread?.chatId,
          });
          originalChatId = newChat.id;
          lastThread.originalChatId = newChat.id.toString();
          await this.threadsRepository.save(lastThread);
        }
      }

      return {
        ok: true,
        threadId: lastThread?.id ? lastThread?.id : null,
        chatId: lastThread.chatId.toString(),
        statusRun: lastThread.sesionStatus,
        originalChatId: originalChatId,
        statusCode: 200,
      };
    } catch (error) {
      return {
        ok: false,
        statusCode: 400,
        message: error?.message || 'An error occurred',
        error: 'Bad Request',
      };
    }
  }

  async createThreads(data) {
    try {
      const originalChatId = data?.originalChatId;
      if (!data) {
        throw new BadRequestException('debe de proveer la data correctamente');
      }

      const newThreads = new ChatGptThreads();
      newThreads.numberPhone = data.numberPhone;
      newThreads.threadId = data.threadId;
      newThreads.sesionStatus = true;
      newThreads.chatId = data.chatId;

      const newChat = await this.chatRepository.save({
        chatIdExternal: newThreads?.chatId,
      });
      newThreads.originalChatId = newChat?.id.toString();

      const resp = await this.threadsRepository.save(newThreads);

      return {
        ok: true,
        message: 'Thread creado exitosamente',
        statusCode: 200,
        thread: resp,
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async createMessageByThrad(
    message: string,
    numberPhone: string,
    isFromIA: boolean,
  ) {
    const lastThread = await this.threadsRepository.findOne({
      where: { numberPhone: numberPhone },
      order: { id: 'DESC' }
    });

    let allMessages = []

    if (lastThread) {
      const chatOfThread = await this.chatRepository.findOne({
        where: { id: Number(lastThread.originalChatId) }, relations: ['mensajes'],
      });

      console.log('la cantidad de menasjes son ', chatOfThread.mensajes.length);


      if (chatOfThread?.mensajes && chatOfThread?.mensajes?.length > 0) {
        allMessages = chatOfThread?.mensajes?.map((m) => {
          if (m.isTool === true) {
            if (m.tool_calls) {
              return {
                role: "assistant",
                content: m.mensaje ?? "Tool calls",
                tool_calls: m.tool_calls
              }

            } else {
              return {
                role: 'tool',
                tool_call_id: m.tool_call_id,
                content: m.mensaje ?? "Tool call",
              }
            }
          } else {
            return {
              role: m.isClient === true ? 'user' : 'assistant',
              content: m.mensaje,
            }
          }
        });
      }

      if (chatOfThread) {
        await this.messageRepository.save({
          mensaje: message,
          isClient: !isFromIA,
          chat: chatOfThread,
        });
      }
    }

    return allMessages
  }

  async updateThreadStatus(threadId: number, timeZone: string) {
    try {
      const thread = await this.threadsRepository.findOne({
        where: { id: threadId },
      });

      if (!thread) {
        return;
      }

      const result = await this.threadsRepository.update(thread.id, {
        last_update: moment.tz(timeZone),
      });

      if (result.affected === 0) {
        throw new BadRequestException('El hilo no se pudo actualizar');
      }

      return {
        ok: true,
        statusCode: 200,
        message: 'Estado del hilo actualizado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message,
        error: 'Bad Request',
      });
    }
  }

  async deleteThread(threadId: string) {
    try {
      if (!threadId) {
        throw new BadRequestException('debe de espesificar el threadId');
      }
      await this.threadsRepository.delete({ threadId });

      return {
        ok: true,
        statusCode: 200,
        message: 'thread borrado exitosamente',
      };
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
