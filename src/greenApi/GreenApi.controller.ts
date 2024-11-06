import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';

@Controller()
export class GrenApiController {
    constructor(
        private readonly greenApi: GreenApiService,
    ) { }

    @Post('/webhooks')
    async handleWebhook( @Req() request: Request, @Body() body: any) {
        if (!body.stateInstance) {
            const empresaType = request["empresaType"]
            const { typeWebhook, messageData, senderData } = body;
            const { sender } = senderData;
            
            const numberSender = sender.match(/^\d+/)[0];

            if (typeWebhook === 'incomingMessageReceived') {
                await this.greenApi.handleMessagetText(messageData, numberSender, empresaType )
            } else if (typeWebhook === 'incomingAudioReceived') {
                console.log("Audio entrante recibido:", messageData);
            }
            else {
                console.log('Evento desconocido del webhook:', typeWebhook);
            }
        } else {
            console.log('La instancia está iniciando.');
        }

    }
}


