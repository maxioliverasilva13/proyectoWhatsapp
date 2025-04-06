import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatGptThreads } from './entities/chatGpThreads.entity';
import * as moment from 'moment-timezone';

@Injectable()
export class ChatGptThreadsService {
    constructor(
        @InjectRepository(ChatGptThreads)
        private threadsRepository: Repository<ChatGptThreads>
    ) { };

    async getLastThreads(numberPhone) {
        try {
            const lastThread = await this.threadsRepository.findOne({
                where: { numberPhone: numberPhone },
                order: { id: 'DESC' }
            });
            

            return {
                ok: true,
                threadId: lastThread?.threadId ? lastThread?.threadId : null,
                statusRun: lastThread.sesionStatus,
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
            if (!data) {
                throw new BadRequestException("debe de proveer la data correctamente")
            }

            const newThreads = new ChatGptThreads;
            newThreads.numberPhone = data.numberPhone
            newThreads.threadId = data.threadId
            newThreads.sesionStatus = true

            await this.threadsRepository.save(newThreads)
            console.log('se creo con id', newThreads.threadId);
            
            return {
                ok: true,
                message: "Thread creado exitosamente",
                statusCode: 200,
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

    async updateThreadStatus(threadId: string, timeZone: string) {
        try {
            const thread = await this.threadsRepository.findOne({ where: { threadId } });

            if (!thread) {
                throw new BadRequestException("El hilo no fue encontrado.");
            }

            const result = await this.threadsRepository.update(thread.id, {
                last_update: moment.tz(timeZone),
            });

            if (result.affected === 0) {
                throw new BadRequestException("El hilo no se pudo actualizar");
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
                throw new BadRequestException("debe de espesificar el threadId")
            }
            await this.threadsRepository.delete({ threadId });

            return {
                ok: true,
                statusCode: 200,
                message: "thread borrado exitosamente"
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
