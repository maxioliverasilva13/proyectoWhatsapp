import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';
import { NumeroConfianzaService } from 'src/numerosConfianza/numeroConfianza.service';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';

@Controller()
export class GrenApiController {
    constructor(
        private readonly greenApi: GreenApiService,
        private readonly numeroConfianza: NumeroConfianzaService,
        private readonly WebSocket: WebsocketGateway,
    ) { }

    @Post('/webhooks')
    async handleWebhook(@Req() request: Request, @Body() body: any) {        
        if(body.stateInstance) {
            const greenApiStatus = body.stateInstance;
            console.log("greenApiStatus", greenApiStatus)
            if (greenApiStatus) {
                console.log('La API de Green está configurada');
                this.WebSocket.sendGreenApiStatus();
            } else {
                console.log('Hubo un problema con la configuración de la API');
            }
        } else {
            const timeZone = request["timeZone"]
            const empresaId = request["empresaId"];
            const empresaType = request["empresaType"];
            const { typeWebhook, messageData, senderData } = body;
            const { sender } = senderData;
            
            const numberSender = sender.match(/^\d+/)[0];
            const senderName = sender.senderName
            // Valido si el número es un número de confianza o no
            const numberExist = await this.numeroConfianza.getOne(numberSender, empresaId);

            if (numberExist.data) {
                return
            } else {
                const message = messageData.textMessageData?.textMessage || messageData.extendedTextMessageData?.text;
                if (typeWebhook === 'incomingMessageReceived') {
                    await this.greenApi.handleMessagetText(
                        message,
                        numberSender,
                        empresaType,
                        empresaId,
                        senderName,
                        timeZone
                    );
                }
                else if (typeWebhook === 'incomingAudioReceived') {
                    // Manejo de mensajes de audio
                    console.log("Audio entrante recibido:", messageData);
                } else {
                    // Manejo de otros tipos de eventos
                    console.log('Evento desconocido del webhook:', typeWebhook);
                }

            }

        }
    }

}


