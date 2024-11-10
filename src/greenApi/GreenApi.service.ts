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

    async handleMessagetText(textMessage, senderData, empresaType) {        
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

        if (empresaType === "DELIVERY") {
            this.hanldeCasesForDelivery(currentThreadId, clienteId, openAIResponseFormatted)
        } else if (empresaType === "RESERVA") {
            this.hanldeCasesForReserva(openAIResponseFormatted, currentThreadId, clienteId)
        }

        // actualizamos el last_updated del thread  
        if (openAIResponseFormatted.status != 4) {
            await this.chatGptThreadsService.updateThreadStatus(threadId)
        }
    }

    async hanldeCasesForDelivery(currentThreadId, clienteId, openAIResponseFormatted) {
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
                await this.hacerPedido(currentThreadId, clienteId, openAIResponseFormatted, undefined)
                break;
            case 5:
                console.log("Listar productos");
                break;
            case 6:
                console.log("Mensaje saludo");
                break;
            case 7:
                console.log("No pudimos procesar tu solicitud");
                break;
            default:
                console.log("Estado no reconocido:", openAIResponseFormatted.status);
                break;
        }

    }

    async hanldeCasesForReserva(openAiRes, currentThreadId, clienteId) {
        switch (openAiRes.status) {
            case 1:
                console.log("espesificar fecha");
                break;
            case 2:
                console.log("falta el nombre del producto");
                break;
            case 3:
                console.log("mensaje fuera de contexto");
                break;
            case 4:
                console.log("Revisar agenda");
                const res = await this.pedidoService.consultarHorarioxd(openAiRes.hora, openAiRes.producto)
                if(res.isAviable === true) {
                    console.log("crear");
                    await this.hacerPedido(currentThreadId, clienteId, openAiRes,openAiRes.hora)
                } else {   1
                    console.log("horario no disponible");
                }

                break;
            case 5:
                console.log("responder saludo");
                break;
            case 6:
                console.log("listar horarios disponibles");
                break;
            case 7:
                console.log("producto no existe");
                break;
        }
    }

    async hacerPedido(currentThreadId, clienteId, openAIResponse, fecha) {
        await this.pedidoService.create({
            clienteId: clienteId,
            confirmado: false,
            estadoId: 1,
            tipo_servicioId: 1,
            productos: openAIResponse.productos,
            fecha
        })
        await closeThread(currentThreadId);
        await this.chatGptThreadsService.deleteThread(currentThreadId)
    }

}
