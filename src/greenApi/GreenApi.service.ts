import { Injectable } from '@nestjs/common';
import { ChatGptThreadsService } from 'src/chatGptThreads/chatGptThreads.service';
import { ClienteService } from 'src/cliente/cliente.service';
import { InfolineService } from 'src/infoline/infoline.service';
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
        private readonly productoService: ProductoService,
        private readonly infoLineService: InfolineService,
    ) { }

    async onModuleInit() {
        const subdomain = process.env.SUBDOMAIN;
        if (subdomain === "works") {
            await connectToGreenApi();
        }
    }

    async handleMessagetText(textMessage, numberSender, empresaType, empresaId) {
        
        const { threadId, statusRun } = await this.chatGptThreadsService.getLastThreads(numberSender);
        
        const { clienteId, clientName } = await this.clienteService.createOrReturnExistClient({ empresaId: empresaId, nombre:numberSender, telefono: numberSender })

        let currentThreadId = threadId;
        if (!threadId) {
            // cargo los productos
            const textProducts = await this.productoService.findAllInText()
            const textInfoLines = await this.infoLineService.findAllFormatedText(empresaType)            
            currentThreadId = await createThread(textProducts, textInfoLines);
            await this.chatGptThreadsService.createThreads({
                numberPhone: numberSender,
                threadId: currentThreadId,
            });
        }

        const openAIResponse = await sendMessageToThread(currentThreadId, textMessage, false);

        
        const cleanJSON = (jsonString: string) => {
            return jsonString
                .replace(/```json/g, '')       
                .replace(/```/g, '')          
                .replace(/[\u2028\u2029]/g, '') 
                .replace(/[“”]/g, '"')         
                .trim();                       
        };
        
        let openAIResponseFormatted;
        try {            
            const openAIResponseRaw = openAIResponse.content[0].text.value;            
            
            openAIResponseFormatted = JSON.parse(cleanJSON(openAIResponseRaw));            
        } catch (error) {
            console.error('Error al parsear el JSON:', error);
        }
        
        if (openAIResponseFormatted?.placeOrder) {        
            if (empresaType === "RESERVA") {
                let status = true;
                for(const items of openAIResponseFormatted.data) {
                    const res = await this.pedidoService.consultarHorario(items.fecha, items);
                    if(res.ok === false) {
                        (`para el producto ${items.nombre} la fecha ${items.fecha} no se encuentra disponible`)
                        await sendMessageToThread(currentThreadId, `lo siento, vuelveme a solicitar la fecha para el producto ${items.nombre} ya que la fecha ${items.fecha} no se encuentra disponible`, true);
                        status = false
                        break;
                    }
                }
                if (status === false) {
                    return;
                }
            } else {
                await this.hacerPedido(currentThreadId, clienteId, openAIResponseFormatted, empresaType, clientName, numberSender);
            }
        } else {
            console.log(openAIResponseFormatted);
        }

        if (!openAIResponseFormatted?.placeOrder) {
            await this.chatGptThreadsService.updateThreadStatus(threadId)
        }
    }

    async hacerPedido(currentThreadId, clienteId, openAIResponse, empresaType ,clientName, numberSender) {
        await this.pedidoService.create({
            clienteId: clienteId,
            clientName: clientName,
            confirmado: false,
            estadoId: 1,
            tipo_servicioId: 1,
            responseJSON: JSON.stringify(openAIResponse),
            products: openAIResponse.data,
            empresaType,
            messages:openAIResponse.messages,
            numberSender
        })
        await closeThread(currentThreadId);
        await this.chatGptThreadsService.deleteThread(currentThreadId)
    }
}
