import { Controller, Post, Body, Get } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';

@Controller()
export class GrenApiController {
    constructor(
        private readonly greenApi: GreenApiService,
    ) { }

    @Post('/webhooks')
    async handleWebhook(@Body() body: any) {        
        const { typeWebhook, messageData, senderData } = body;
        const { sender } = senderData;
        const numberSender = sender.match(/^\d+/)[0];
        if (typeWebhook === 'incomingMessageReceived') {
            this.greenApi.handleMessage(messageData,numberSender)
        } else if (typeWebhook === 'incomingAudioReceived') {
            console.log("Audio entrante recibido:", messageData);
        }
        else {
            console.log('Evento desconocido del webhook:', typeWebhook);
        }
    }
}

