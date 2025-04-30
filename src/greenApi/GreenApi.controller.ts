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
    @InjectQueue(`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`)
    private readonly messageQueue: Queue,
  ) {}

  @Post('/webhooks')
  async handleWebhook(@Req() request: Request, @Body() body: any) {
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
        const senderData = body?.senderData;
        const sender = senderData?.sender;
        const chatId = senderData?.chatId;
        const numberSender = sender.match(/^\d+/)[0];
        const senderName = sender.senderName;
        const numberExist = await this.numeroConfianza.getOne(
          numberSender,
          empresaId,
        );
        let chatExist = await this.chatRepository.findOne({
          where: { chatIdExternal: chatId },
        });

        const globalCconnection = await handleGetGlobalConnection();
        const empresa = await globalCconnection.getRepository(Empresa);
        const InfoCompany = await empresa.findOne({ where: { id: empresaId } });

        try {
          if (numberExist?.data) {
            return;
          } else {
            const now = moment().tz(timeZone);

            const apertura = moment.tz(
              InfoCompany.hora_apertura,
              'HH:mm:ss',
              timeZone,
            );
            const cierre = moment.tz(
              InfoCompany.hora_cierre,
              'HH:mm:ss',
              timeZone,
            );

            const estaDentroDeHorario =
              InfoCompany.abierto &&
              (apertura.isBefore(cierre)
                ? now.isAfter(apertura) && now.isBefore(cierre)
                : now.isAfter(apertura) || now.isBefore(cierre));

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

              console.log('voy a crear un thread', messageData);

              const respText = await this.greenApi.handleMessagetText(
                messageToSend,
                numberSender,
                empresaType,
                empresaId,
                senderName,
                timeZone,
                chatId,
              );

              console.log("respText", respText)
              if (respText?.ok === false) {
                console.log('Mensaje descartado, no se responderá');
                return;
              } else {
                await this.messageQueue.add(
                  'send',
                  {
                    message: respText,
                    chatId,
                  },
                  {
                    priority: 0,
                    attempts: 5,
                  },
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
              }
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
  }
}
