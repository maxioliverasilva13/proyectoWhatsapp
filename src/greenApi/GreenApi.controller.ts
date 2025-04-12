import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';
import { NumeroConfianzaService } from 'src/numerosConfianza/numeroConfianza.service';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { SpeechToText } from 'src/utils/openAIServices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller()
export class GrenApiController {
  constructor(
    private readonly greenApi: GreenApiService,
    private readonly numeroConfianza: NumeroConfianzaService,
    private readonly WebSocket: WebsocketGateway,
    @InjectQueue('green-api-response-message') private readonly messageQueue: Queue,
  ) {}

  @Post('/webhooks')
  async handleWebhook(@Req() request: Request, @Body() body: any) {
    console.log('aca 1', body);
    if (body.stateInstance) {
      const greenApiStatus = body.stateInstance;
      console.log('greenApiStatus', greenApiStatus);
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

        if (numberExist?.data) {
          return;
        } else {
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
            );

            const resp = await this.messageQueue.add('send', {
              message: respText,
              chatId,
            }, {
              priority: 1
            });
            console.log("job added", resp)
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
            );

            const resp = await this.messageQueue.add('send', {
              message: respText,
              chatId,
            });
            console.log("job added", resp)

          } else {
            console.log('Evento desconocido del webhook:', typeWebhook);
          }
        }
      } else {
        return;
      }
    }
  }

}
