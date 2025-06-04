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
import { translations } from 'src/lenguage/translation';
import { getLanguageFromTimezone } from 'src/lenguage/utils';
import { HorarioService } from 'src/horario/horario.service';
import { estaAbierto } from 'src/horario/utils';

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
    private readonly horarioService: HorarioService,
    @InjectQueue(`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`)
    private readonly messageQueue: Queue,
    private readonly redisService: RedisService,
  ) { }

  @Post('/webhooks')
  async handleWebhook(@Req() request: Request, @Body() body: any) {
    try {
      console.log("entor")
      if (process.env.SUBDOMAIN === 'app') return;
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
          // const orderPlanStatus = await this.pedidoService.orderPlanStatus();
          // if (orderPlanStatus?.slotsToCreate <= 0) {
          //   return;
          // }
          const senderData = body?.senderData;
          const sender = senderData?.sender;
          const chatId = senderData?.chatId;
          const numberSender = sender?.match(/^\d+/)[0];
          const senderName = senderData?.chatName ?? senderData?.senderName;
          const numberExist = await this.numeroConfianza.getOne(
            numberSender,
            empresaId,
          );
          let chatExist = await this.chatRepository.findOne({
            where: { chatIdExternal: chatId },
          });
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
          console.log('sigo 2');

          try {
            if (numberExist?.data) {
              return;
            } else {

              const estaDentroDeHorario = await estaAbierto(InfoCompany?.timeZone, this.horarioService);

              if (estaDentroDeHorario === true) {
                let messageToSend;

                if (
                  messageData.typeMessage === 'textMessage' ||
                  messageData?.typeMessage === 'extendedTextMessage'
                ) {
                  messageToSend =
                    messageData.textMessageData?.textMessage ||
                    messageData.extendedTextMessageData?.text;
                } else if (messageData.typeMessage === 'audioMessage') {
                  const fileUrl = messageData.fileMessageData.downloadUrl;
                  messageToSend = await SpeechToText(fileUrl);
                } else if (messageData.typeMessage === 'imageMessage' || messageData?.typeMessage === "documentMessage") {
                  const imageUrl = messageData.fileMessageData.downloadUrl;
                  messageToSend = `[Imagen recibida] ${imageUrl}`;
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
                  delayMs: 5000,
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
                      console.log('xd2', typeof respText);
                      console.log("valor es", respText);

                      let info = { message: undefined }
                      if (typeof respText === "string") {
                        info = JSON.parse(respText ?? "{}")
                      } else if (typeof respText === "object") {
                        // if (typeof respText?.message?.contains("ok")) {
                        //   const cleaned = respText?.message.replace(/\\"/g, '"');
                        //   const parsed = JSON.parse(cleaned ?? "{}");
                        //   console.log("parsed", parsed)
                        //   info = parsed;
                        // } else {
                        //   info = respText;
                        // }
                        info = respText;
                      }
                      await this.messageQueue.add(
                        'send',
                        { chatId, message: info },
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
                const timezoneEmpresa = InfoCompany?.timeZone;
                const lang = getLanguageFromTimezone(timezoneEmpresa);

                const now = moment.tz(timezoneEmpresa);
                const dayOfWeek = now.isoWeekday();

                const horarios = await this.horarioService.findByDay(dayOfWeek);

                let textResponse = '';

                if ((translations[lang] ?? '') && horarios.length > 0) {
                  // Convertimos cada horario a texto: "08:00 - 12:00"
                  const horariosStr = horarios
                    .map(h => `${h.hora_inicio.slice(0, 5)} - ${h.hora_fin.slice(0, 5)}`)
                    .join(', ');

                  textResponse = translations[lang].closed_hours(horariosStr);
                } else {
                  textResponse = translations[lang]?.closed ?? '';
                }

                await this.messageQueue.add(
                  'send',
                  {
                    chatId: chatId,
                    message: { message: textResponse },
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
