import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';
import { NumeroConfianzaService } from 'src/numerosConfianza/numeroConfianza.service';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { SpeechToText } from 'src/utils/openAIServices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmpresaService } from 'src/empresa/empresa.service';
import * as moment from 'moment-timezone'

@Controller()
export class GrenApiController {
  constructor(
    private readonly greenApi: GreenApiService,
    private readonly numeroConfianza: NumeroConfianzaService,
    private readonly WebSocket: WebsocketGateway,
    private readonly empresaService: EmpresaService,

    @InjectQueue(`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`) private readonly messageQueue: Queue,
  ) { }

  @Post('/webhooks')
  async handleWebhook(@Req() request: Request, @Body() body: any) {
    if (process.env.SUBDOMAIN === "app") return;
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
        const InfoCompany = await this.empresaService.findOne(empresaId)
        const sender = senderData?.sender;
        const chatId = senderData?.chatId;
        const numberSender = sender.match(/^\d+/)[0];
        const senderName = sender.senderName;
        const numberExist = await this.numeroConfianza.getOne(
          numberSender,
          empresaId,
        );

        const now = moment().tz(timeZone);

        const apertura = moment.tz(InfoCompany.hora_apertura, 'HH:mm', timeZone);
        const cierre = moment.tz(InfoCompany.hora_cierre, 'HH:mm', timeZone);

        if (numberExist?.data) {
          return;
        } else {
          if ((InfoCompany.abierto) && now.isAfter(apertura) && now.isBefore(cierre)) {
            if (messageData.typeMessage === 'textMessage') {
              const message =
                messageData.textMessageData?.textMessage ||
                messageData.extendedTextMessageData?.text;
    
              const respText = await this.greenApi.handleMessagetText(
                message,
                numberSender,
                empresaType,
                empresaId,
                senderName,
                timeZone,
                chatId
              );
    
              const resp = await this.messageQueue.add('send', {
                message: respText,
                chatId,
              }, {
                priority: 0,
                attempts: 5,
              });
    
            } else if (messageData.typeMessage === 'audioMessage') {
              const fileUrl = messageData.fileMessageData.downloadUrl;
    
              const speechToText = await SpeechToText(fileUrl);
    
              const respText = await this.greenApi.handleMessagetText(
                speechToText,
                numberSender,
                empresaType,
                empresaId,
                senderName,
                timeZone,
                chatId
              );
    
              const resp = await this.messageQueue.add('send', {
                message: respText,
                chatId,
              }, {
                priority: 0,
                attempts: 5,
              });
              console
              console.log("job added", resp?.id)
    
            } else {
              console.log('Evento desconocido del webhook:', typeWebhook);
            }
          } else {
            const resp = await this.messageQueue.add('send', {
              message: `Sorry, we are currently closed. Please remember that our business hours are from ${apertura} PM to ${cierre}.`,
              chatId: 0
            })
          }
        }
      } else {
        return;
      }
    }
  }

}
