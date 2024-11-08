import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';
import { NumeroConfianzaService } from 'src/numerosConfianza/numeroConfianza.service';

@Controller()
export class GrenApiController {
    constructor(
        private readonly greenApi: GreenApiService,
        private readonly numeroConfianza: NumeroConfianzaService,
    ) { }

    @Post('/webhooks')
    async handleWebhook(@Req() request: Request, @Body() body: any) {
        if (!body.stateInstance) {
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

        } else {
            console.log('La instancia está iniciando.');
        }
    }

}


