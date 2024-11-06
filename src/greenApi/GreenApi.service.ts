import { Injectable } from '@nestjs/common';
import { ChatGptThreadsService } from 'src/chatGptThreads/chatGptThreads.service';
import { ClienteService } from 'src/cliente/cliente.service';
import { PedidoService } from 'src/pedido/pedido.service';
import { ProductoService } from 'src/producto/producto.service';
import { connectToGreenApi } from 'src/utils/greenApi';
import { askAssistant, closeThread, createThread, sendMessageToThread } from 'src/utils/openAIServices';

@Injectable()
export class GreenApiService {
    constructor(
        private readonly chatGptThreadsService: ChatGptThreadsService,
        private readonly pedidoService: PedidoService,
        private readonly clienteService: ClienteService,
        private readonly productoService: ProductoService

    ) { }

    async onModuleInit() {
        const subdomain = process.env.SUBDOMAIN;
        if (subdomain === "works") {
            await connectToGreenApi();
        }
    }

    async handleMessagetText(messageData, senderData, empresaType) {
        const { textMessageData: { textMessage } } = messageData;
        const { threadId, statusRun } = await this.chatGptThreadsService.getLastThreads(senderData);
        const { clienteId } = await this.clienteService.createOrReturnExistClient({ empresaId: 1, nombre: "rodri", telefono: senderData })

        let currentThreadId = threadId;
        if (!threadId) {
            // cargo los productos
            const textProducts = await this.productoService.findAllInText()
            
            currentThreadId = await createThread(textProducts);
            await this.chatGptThreadsService.createThreads({
                numberPhone: senderData,
                threadId: currentThreadId,
            });
        }

        const openAIResponse = await sendMessageToThread(currentThreadId, textMessage, empresaType);

        const openAIResponseFormatted = JSON.parse(openAIResponse.content[0].text.value);

        if(empresaType === "DELIVERY") {
            this.hanldeCasesForDelivery(currentThreadId,clienteId, openAIResponseFormatted)
        } else if(empresaType === "RESERVA") {
            this.hanldeCasesForReserva()
        }

        console.log(openAIResponseFormatted);
        
        // actualizamos el last_updated del thread  
        if(openAIResponseFormatted.status != 4) {
            await this.chatGptThreadsService.updateThreadStatus(threadId)
        }
    }

    async hanldeCasesForDelivery (currentThreadId,clienteId,openAIResponseFormatted) {
        switch (openAIResponseFormatted.status) {
            case 1:
                console.log("Falta nombre del producto");
                break;
            case 2:
                console.log("Falta dirección");
                break;
            case 3:
                console.log("El producto no esta disponible");
                break;
            case 4:
                console.log("Crear pedido");
                // tarea: responder al user
                await this.hacerPedido(currentThreadId, clienteId, openAIResponseFormatted)
                break;
            case 5:
                console.log("Listar productos");
                break;
            default:
                console.log("Estado no reconocido:", openAIResponseFormatted.status);
                break;
        }
    }

    async hanldeCasesForReserva () {
        console.log("jajajaja");
        
    }


    async hacerPedido(currentThreadId, clienteId, openAIResponse) {
        await this.chatGptThreadsService.deleteThread(currentThreadId)
        await closeThread(currentThreadId);

        await this.pedidoService.create({
            clienteId: clienteId,
            confirmado: false,
            estadoId: 1,
            tipo_servicioId: 1,
            productos: openAIResponse.productos
        })

    }

}
