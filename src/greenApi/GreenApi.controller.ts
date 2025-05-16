import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';
import { NumeroConfianzaService } from 'src/numerosConfianza/numeroConfianza.service';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { SpeechToText } from 'src/utils/openAIServices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as moment from 'moment-timezone';
import { handleGetGlobalConnection } from 'src/utils/dbConnection';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from 'src/chat/entities/chat.entity';
import { Repository } from 'typeorm';
import { Mensaje } from 'src/mensaje/entities/mensaje.entity';
import { ChatService } from 'src/chat/chat.service';
import { MensajeService } from 'src/mensaje/mensaje.service';
import { encode } from 'gpt-3-encoder';
import { RedisService } from 'src/redis/redis.service';
import { PedidoService } from 'src/pedido/pedido.service';

@Controller()
export class GrenApiController {
  constructor(
    private readonly greenApi: GreenApiService,
    private readonly numeroConfianza: NumeroConfianzaService,
    private readonly WebSocket: WebsocketGateway,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Mensaje)
    private readonly chatService: ChatService,
    private readonly messagesService: MensajeService,
    private readonly pedidoService: PedidoService,
    @InjectQueue(`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`)
    private readonly messageQueue: Queue,
    private readonly redisService: RedisService,
  ) {}

  @Post('/webhooks')
  async handleWebhook(@Req() request: Request, @Body() body: any) {
    try {
      if (process.env.SUBDOMAIN === 'app') return;
      console.log('sip vengo', body?.stateInstance);
      if (body.stateInstance) {
        const greenApiStatus = body.stateInstance;
        if (greenApiStatus) {
          console.log('La API de Green está configurada');
          this.WebSocket.sendGreenApiStatus();
        } else {
          console.log('Hubo un problema con la configuración de la API');
        }
      } else {
        const timeZone = request['timeZone'];
        const empresaId = request['empresaId'];
        const empresaType = request['empresaType'];
        const { typeWebhook, messageData } = body;

        if (typeWebhook === 'incomingMessageReceived') {
          console.log('mensaje recibido');
          const orderPlanStatus = await this.pedidoService.orderPlanStatus();
          if (orderPlanStatus?.slotsToCreate <= 0) {
            return;
          }
          console.log('plan ok');

          const senderData = body?.senderData;
          const sender = senderData?.sender;
          const chatId = senderData?.chatId;
          const numberSender = sender.match(/^\d+/)[0];
          const senderName = senderData?.chatName ?? senderData.senderName;
          const numberExist = await this.numeroConfianza.getOne(
            numberSender,
            empresaId,
          );
          console.log('numberExist', numberExist);
          let chatExist = await this.chatRepository.findOne({
            where: { chatIdExternal: chatId },
          });
          console.log("chatExist", chatExist)

          const globalCconnection = await handleGetGlobalConnection();
          const empresa = await globalCconnection.getRepository(Empresa);
          const InfoCompany = await empresa.findOne({
            where: { id: empresaId },
            relations: ['payment', 'payment.plan'],
          });

          if (!InfoCompany.assistentEnabled) {
            return;
          }

          if (!InfoCompany) {
            console.error('Comania no encontrada');
            return;
          }
          console.log("sigo 2")

          try {
            if (numberExist?.data) {
              return;
            } else {

              console.log("sigo 3")
              const now = moment.tz(timeZone);
              const apertura = now.clone().set({
                hour: parseInt(InfoCompany.hora_apertura.split(':')[0]),
                minute: parseInt(InfoCompany.hora_apertura.split(':')[1]),
                second: 0,
                millisecond: 0,
              });

              const cierre = now.clone().set({
                hour: parseInt(InfoCompany.hora_cierre.split(':')[0]),
                minute: parseInt(InfoCompany.hora_cierre.split(':')[1]),
                second: 0,
                millisecond: 0,
              });

              const estaDentroDeHorario =
                InfoCompany.abierto &&
                (apertura.isBefore(cierre)
                  ? now.isBetween(apertura, cierre)
                  : now.isSameOrAfter(apertura) || now.isBefore(cierre));
                
              console.log("estaDentroDeHorario", estaDentroDeHorario)
              if (estaDentroDeHorario) {
                let messageToSend;

                if (messageData.typeMessage === 'textMessage') {
                  messageToSend =
                    messageData.textMessageData?.textMessage ||
                    messageData.extendedTextMessageData?.text;
                } else if (messageData.typeMessage === 'audioMessage') {
                  const fileUrl = messageData.fileMessageData.downloadUrl;
                  messageToSend = await SpeechToText(fileUrl);
                } else {
                  return;
                }

                const tokens = encode(messageToSend);
                console.log('tokens length', tokens?.length);
                if (tokens.length > 250) {
                  console.log(
                    'Error, mensaje muy largo, tokens length',
                    tokens,
                  );
                  await this.messageQueue.add(
                    'send',
                    {
                      chatId: chatId,
                      message: {
                        message:
                          'Lo sentimos, tu mensaje es demasiado extenso para procesarlo correctamente. ¿Podés resumirlo un poco para que podamos ayudarte mejor? 😊',
                      },
                    },
                    {
                      priority: 0,
                      attempts: 5,
                    },
                  );
                  return;
                }

                await this.redisService.handleIncomingMessageWithBuffering({
                  chatId,
                  message: messageToSend,
                  delayMs: 10000,
                  maxTokens: 250,
                  numberSender,
                  empresaType,
                  empresaId,
                  senderName,
                  timeZone,
                  process: async (fullMessage: string) => {
                    if (fullMessage === '[ERROR]:too-long') {
                      await this.messageQueue.add(
                        'send',
                        {
                          chatId: chatId,
                          message: {
                            message:
                              'Lo sentimos, tu mensaje es demasiado extenso para procesarlo correctamente. ¿Podés resumirlo un poco para que podamos ayudarte mejor?',
                          },
                        },
                        { priority: 0, attempts: 5 },
                      );
                      return;
                    }

                    const respText = await this.greenApi.handleMessagetText(
                      fullMessage,
                      numberSender,
                      empresaType,
                      empresaId,
                      senderName,
                      timeZone,
                      chatId,
                    );
                    if (!respText?.isError) {
                      await this.messageQueue.add(
                        'send',
                        { chatId, message: respText },
                        { priority: 0, attempts: 5 },
                      );

                      if (!chatExist) {
                        const { data } = await this.chatService.create({
                          chatIdExternal: chatId,
                        });
                        chatExist = data;
                      }

                      if (chatExist) {
                        await Promise.all([
                          this.messagesService.create({
                            chat: chatExist.id,
                            isClient: true,
                            mensaje: messageToSend,
                          }),
                          this.messagesService.create({
                            chat: chatExist.id,
                            isClient: false,
                            mensaje: respText,
                          }),
                        ]);
                      }
                    } else {
                      console.log('Mensaje descartado, no se responderá');
                      return;
                    }
                  },
                });
              } else {
                let textReponse = '';
                if (InfoCompany.hora_apertura && InfoCompany.hora_cierre) {
                  const aperturaStr = apertura.format('HH:mm');
                  const cierreStr = cierre.format('HH:mm');
                  textReponse = `Sorry, we are currently closed. Please remember that our business hours are from ${aperturaStr} to ${cierreStr}.`;
                } else {
                  textReponse = `Sorry, we are currently closed.`;
                }

                await this.messageQueue.add(
                  'send',
                  {
                    chatId: chatId,
                    message: { message: textReponse },
                  },
                  {
                    priority: 0,
                    attempts: 5,
                  },
                );
              }
            }
          } finally {
            globalCconnection.destroy();
          }
        } else {
          return;
        }
      }
    } catch (error: any) {
      console.log('fallo aca', error);
    }
  }
}
