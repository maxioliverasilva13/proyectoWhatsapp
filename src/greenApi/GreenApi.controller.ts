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
        console.log('xd1', body);
        if(body.stateInstance) {
        console.log('xd2', body.stateInstance);
            const greenApiStatus = body.stateInstance;
            console.log("greenApiStatus", greenApiStatus)
            if (greenApiStatus) {
                console.log('La API de Green está configurada');
                this.WebSocket.sendGreenApiStatus();
            } else {
                console.log('Hubo un problema con la configuración de la API');
            }
        }else {
            const empresaId = request["empresaId"];
            const empresaType = request["empresaType"];
            const { typeWebhook, messageData, senderData } = body;
            const { sender } = senderData;
            const numberSender = sender.match(/^\d+/)[0];
            console.log(numberSender);
            
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
                        empresaType
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


