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

    async handleMessagetText(textMessage, numberSender, empresaType, empresaId, senderName, timeZone) {
        const { threadId } = await this.chatGptThreadsService.getLastThreads(numberSender);

        const { clienteId, clientName } = await this.clienteService.createOrReturnExistClient({ empresaId: empresaId, nombre: senderName, telefono: numberSender })

        let currentThreadId = threadId;
        if (!threadId) {
            // cargo los productos
            const textProducts = await this.productoService.findAllInText()
            const textInfoLines = await this.infoLineService.findAllFormatedText(empresaType)
            currentThreadId = await createThread(textProducts, textInfoLines, empresaType);
            await this.chatGptThreadsService.createThreads({
                numberPhone: numberSender,
                threadId: currentThreadId,
            });
        }

        const openAIResponse = await sendMessageToThread(currentThreadId, textMessage, false, timeZone);

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
        let textError;
        let respFinalToUser;
        if (openAIResponseFormatted?.placeOrder) {
            if (empresaType === "RESERVA") {
                let status = true;
                for (const items of openAIResponseFormatted.data) {

                    const res = await this.pedidoService.consultarHorario(items.fecha, items, timeZone, empresaId);
                    if (res.ok === false) {
                        console.log(`para el producto ${items.nombre} la fecha ${items.fecha} no se encuentra disponible`)
                        const res = await sendMessageToThread(currentThreadId, `lo siento, vuelveme a solicitar la fecha para el producto ${items.nombre} ya que la fecha ${items.fecha} no se encuentra disponible`, true, timeZone);
                        const openAIResponseRaw = res.content[0].text.value;

                        textError = JSON.parse(cleanJSON(openAIResponseRaw));
                        status = false
                        break;
                    }
                }
                if (status === false) {
                    return;
                } else {
                    respFinalToUser = await this.hacerPedido(currentThreadId, clienteId, openAIResponseFormatted, empresaType, clientName, numberSender);
                }
            } else {
                respFinalToUser = await this.hacerPedido(currentThreadId, clienteId, openAIResponseFormatted, empresaType, clientName, numberSender);
            }
        } else {
            const respToUser = textError ? textError : openAIResponseFormatted
            return respToUser
        }
        if(openAIResponseFormatted.placeOrder) {
            return { ok: true, message: respFinalToUser }
        } else{
            await this.chatGptThreadsService.updateThreadStatus(threadId, timeZone)
        }
    }

    async hacerPedido(currentThreadId, clienteId, openAIResponse, empresaType, clientName, numberSender) {
        const newOrder = await this.pedidoService.create({
            clienteId: clienteId,
            clientName: clientName,
            confirmado: false,
            estadoId: 1,
            products: openAIResponse.data,
            empresaType,
            messages: openAIResponse.messages,
            numberSender,
            infoLinesJson: openAIResponse.infoLines,
            fecha: openAIResponse.fecha
        })
        await this.chatGptThreadsService.deleteThread(currentThreadId)
        return newOrder.messageToUser
    }
}
