import { Injectable } from '@nestjs/common';
import { ChatGptThreadsService } from 'src/chatGptThreads/chatGptThreads.service';
import { ClienteService } from 'src/cliente/cliente.service';
import { PedidoService } from 'src/pedido/pedido.service';
import { connectToGreenApi } from 'src/utils/greenApi';
import { askAssistant, closeThread, createThread, sendMessageToThread } from 'src/utils/openAIServices';

@Injectable()
export class GreenApiService {
    constructor(
        private readonly chatGptThreadsService: ChatGptThreadsService,
        private readonly pedidoService: PedidoService,
        private readonly clienteService: ClienteService
    ) { }

    async onModuleInit() {
        const subdomain = process.env.SUBDOMAIN;
        if (subdomain === "works") {
            await connectToGreenApi();
        }
    }

    async handleMessage(messageData, senderData) {
        const { textMessageData: { textMessage } } = messageData;
        const { threadId } = await this.chatGptThreadsService.getLastThreads(senderData);
        const { clienteId } = await this.clienteService.createOrReturnExistClient({ empresaId: 1, nombre: "rodri", telefono: senderData })
        
        let currentThreadId = threadId;
                
        if (!threadId) {            
            currentThreadId = await createThread();
            await this.chatGptThreadsService.createThreads({
                numberPhone: senderData,
                threadId: currentThreadId,
            });
        }

        const openAIResponse = await sendMessageToThread(currentThreadId, textMessage);
        const openAIResponseFormatted = JSON.parse(openAIResponse.content[0].text.value);
                
        switch (openAIResponseFormatted.status) {
            case 1:
                console.log("Falta nombre del producto");
                break;
            case 2:
                console.log("Falta dirección");
                break;
            case 3:
                console.log("Respuesta no especificada");
                break;
            case 4:
                console.log("Crear pedido");
                // resonder al user
                 this.hacerPedido(currentThreadId, clienteId)
                break;
            case 5:
                console.log("Listar productos");
                break;
            default:
                console.log("Estado no reconocido:", openAIResponseFormatted.status);
                break;
        }
        // actualizamos el last_updated del thread        
        await this.chatGptThreadsService.updateThreadStatus(threadId)
    }

    async hacerPedido(currentThreadId, clienteId) {
        await this.pedidoService.create({
            clienteId: clienteId,
            confirmado: false,
            estadoId: 1,
            tipo_servicioId: 1
        })

        await closeThread(currentThreadId);
    }

}
