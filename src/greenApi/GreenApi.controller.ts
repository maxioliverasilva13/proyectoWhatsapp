import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { GreenApiService } from './GreenApi.service';
import { Request } from 'express';
import { NumeroConfianzaService } from 'src/numerosConfianza/numeroConfianza.service';
import { WebsocketGateway } from 'src/websocket/websocket.gatewat';
import { SpeechToText } from 'src/utils/openAIServices';

const retriveMessage = async (message, chatId) => {
    console.log('recibo', message);

    const payload = {
        chatId: chatId,
        message: message?.message,
    }
    try {
        const resp = await fetch(`https://api.greenapi.com/waInstance${process.env.ID_INSTANCE}/sendMessage/${process.env.API_TOKEN_INSTANCE}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            body: JSON.stringify(payload)
        })

        const respF = await resp.json()
        return respF

    } catch (error: any) {
        console.log(error.response.data.message);
    }
}

@Controller()
export class GrenApiController {
    constructor(
        private readonly greenApi: GreenApiService,
        private readonly numeroConfianza: NumeroConfianzaService,
        private readonly WebSocket: WebsocketGateway,
    ) { }

    @Post('/webhooks')
    async handleWebhook(@Req() request: Request, @Body() body: any) {

        if (body.stateInstance) {
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
            const { typeWebhook, messageData } = body;

            if (typeWebhook === 'incomingMessageReceived') {
                const senderData = body?.senderData;

                const sender = senderData?.sender;
                const chatId = senderData?.chatId;
                const numberSender = sender.match(/^\d+/)[0];
                const senderName = sender.senderName
                const numberExist = await this.numeroConfianza.getOne(numberSender, empresaId);

                if (numberExist.data) {
                    return;
                } else {
                    if (messageData.typeMessage === 'textMessage') {
                        const message = messageData.textMessageData?.textMessage || messageData.extendedTextMessageData?.text;

                        const respText = await this.greenApi.handleMessagetText(
                            message,
                            numberSender,
                            empresaType,
                            empresaId,
                            senderName,
                            timeZone
                        );

                        await retriveMessage(respText, chatId)
                    }
                    else if (messageData.typeMessage === 'audioMessage') {
                        const fileUrl = messageData.fileMessageData.downloadUrl

                        const speechToText = await SpeechToText(fileUrl)

                        const respText = await this.greenApi.handleMessagetText(
                            speechToText,
                            numberSender,
                            empresaType,
                            empresaId,
                            senderName,
                            timeZone
                        );

                        await retriveMessage(respText, chatId)
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


