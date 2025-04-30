import { Injectable } from '@nestjs/common';
import { ChatGptThreadsService } from 'src/chatGptThreads/chatGptThreads.service';
import { ClienteService } from 'src/cliente/cliente.service';
import { DeviceService } from 'src/device/device.service';
import { InfolineService } from 'src/infoline/infoline.service';
import { Pedido } from 'src/pedido/entities/pedido.entity';
import { PedidoService } from 'src/pedido/pedido.service';
import { ProductoService } from 'src/producto/producto.service';
import { connectToGreenApi } from 'src/utils/greenApi';
import {
  askAssistant,
  closeThread,
  createThread,
  sendMessageToThread,
} from 'src/utils/openAIServices';

@Injectable()
export class GreenApiService {
  constructor(
    private readonly chatGptThreadsService: ChatGptThreadsService,
    private readonly pedidoService: PedidoService,
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly infoLineService: InfolineService,
    private readonly deviceService: DeviceService,
  ) {}

  async onModuleInit() {
    const subdomain = process.env.SUBDOMAIN;
    if (subdomain === 'works') {
      await connectToGreenApi();
    }
  }

  async handleMessagetText(
    textMessage,
    numberSender,
    empresaType,
    empresaId,
    senderName,
    timeZone,
    chatId,
  ) {
    const { threadId, chatId: chatIdExist } =
      await this.chatGptThreadsService.getLastThreads(numberSender);

    const { clienteId, clientName } =
      await this.clienteService.createOrReturnExistClient({
        empresaId: empresaId,
        nombre: senderName,
        telefono: numberSender,
      });
    let currentPedidosInText = '';

    let currentThreadId = threadId;
    if (!threadId) {
      if (clienteId) {
        currentPedidosInText = await this.pedidoService.getMyOrders(clienteId);
      }
      const currenciesText = await this.productoService.getCurrencies();
      const textProducts = await this.productoService.findAllInText();
      const textInfoLines =
        await this.infoLineService.findAllFormatedText(empresaType);
      currentThreadId = await createThread(
        textProducts,
        textInfoLines,
        currentPedidosInText,
        empresaType,
        currenciesText,
      );
      await this.chatGptThreadsService.createThreads({
        numberPhone: numberSender,
        threadId: currentThreadId,
        chatId,
      });
    }

    const openAIResponse = await sendMessageToThread(
      currentThreadId,
      textMessage,
      false,
      timeZone,
    );
    if (openAIResponse?.ok === false) {
      return { ok: false }
    }

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

    if (openAIResponseFormatted?.pedidoIdToEdit) {
      this.pedidoService.update(
        openAIResponseFormatted?.pedidoIdToEdit,
        openAIResponseFormatted?.pedidoEdited,
      );
      return openAIResponseFormatted;
    } else if (openAIResponseFormatted?.pedidoIdToCancel) {
      this.pedidoService.cancel(openAIResponseFormatted?.pedidoIdToCancel);
      return openAIResponseFormatted;
    } else if (openAIResponseFormatted?.placeOrder) {
      if (empresaType === 'RESERVA') {
        let status = true;
        for (const items of openAIResponseFormatted.data) {
          const res = await this.pedidoService.consultarHorario(
            items.fecha,
            items,
            timeZone,
            empresaId,
          );
          if (res.ok === false) {
            const res = await sendMessageToThread(
              currentThreadId,
              `lo siento, vuelveme a solicitar la fecha para el producto ${items.nombre} ya que la fecha ${items.fecha} no se encuentra disponible`,
              true,
              timeZone,
            );
            const openAIResponseRaw = res.content[0].text.value;

            textError = JSON.parse(cleanJSON(openAIResponseRaw));
            status = false;
            break;
          }
        }
        if (status === false) {
          console.log("status false")
          return;
        } else {
          console.log("voy a hacer el pedido")
          respFinalToUser = await this.hacerPedido(
            currentThreadId,
            clienteId,
            openAIResponseFormatted,
            empresaType,
            clientName,
            numberSender,
            chatIdExist,
            empresaId,
            openAIResponseFormatted?.messagePushTitle,
            openAIResponseFormatted?.messagePush,
          );
        }
      } else {
        respFinalToUser = await this.hacerPedido(
          currentThreadId,
          clienteId,
          openAIResponseFormatted,
          empresaType,
          clientName,
          numberSender,
          chatIdExist,
          empresaId,
          openAIResponseFormatted?.messagePushTitle,
          openAIResponseFormatted?.messagePush,
        );
      }
    } else {
      const respToUser = textError ? textError : openAIResponseFormatted;
      return respToUser;
    }
    if (openAIResponseFormatted.placeOrder) {
      return { ok: true, message: respFinalToUser };
    } else {
      await this.chatGptThreadsService.updateThreadStatus(threadId, timeZone);
    }
  }

  async hacerPedido(
    currentThreadId,
    clienteId,
    openAIResponse,
    empresaType,
    clientName,
    numberSender,
    chatIdExist,
    empresaId: any,
    messagePushTitle = "Test 1",
    messagePush = 'Test',
  ) {
    try {
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
        fecha: openAIResponse.fecha,
        messageToUser: openAIResponse?.messageToUser,
        chatId: chatIdExist,
      });
      await this.chatGptThreadsService.deleteThread(currentThreadId);
      await this.deviceService.sendNotificationEmpresa(
        empresaId,
        messagePushTitle,
        messagePush,
      );
    return newOrder.messageToUser;
    } catch (error) {
      console.log("error haciendo pedido", error)
      return null;
    }
  }
}
