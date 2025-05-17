import { Injectable } from '@nestjs/common';
import { encode } from 'querystring';
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
    if (
      subdomain !== 'app' &&
      process.env.ID_INSTANCE &&
      process.env.API_TOKEN_INSTANCE
    ) {
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
    let originalChatId = '';
    const {
      threadId,
      chatId: chatIdExist,
      originalChatId: originalChatFromThread,
    } = await this.chatGptThreadsService.getLastThreads(numberSender);
    if (originalChatFromThread) {
      originalChatId = originalChatFromThread;
    }

    console.log('senderName', senderName);

    const { clienteId, clientName } =
      await this.clienteService.createOrReturnExistClient({
        empresaId: empresaId,
        nombre: senderName,
        telefono: numberSender,
      });

    let currentThreadId = threadId;
    if (!threadId) {
      currentThreadId = await createThread(empresaType, empresaId, clienteId);

      const resp = await this.chatGptThreadsService.createThreads({
        numberPhone: numberSender,
        threadId: currentThreadId,
        chatId: chatId,
        originalChatId: originalChatId,
      });
      if (resp?.thread?.originalChatId) {
        originalChatId = resp?.thread?.originalChatId;
      }
    }
    console.log('pertenece al chat', originalChatId);
    await this.chatGptThreadsService.createMessageByThrad(
      textMessage,
      numberSender,
      false,
    );

    const openAIResponse = await sendMessageToThread(
      currentThreadId,
      textMessage,
      false,
      timeZone,
      this.productoService,
      this.pedidoService,
      this,
      this.infoLineService,
      empresaId,
      clienteId,
      empresaType,
      clientName,
      numberSender,
      chatIdExist,
      clienteId,
      originalChatId,
    );

    if (openAIResponse?.isError === true) {
      return { isError: true };
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

    console.log('afuera', openAIResponse);

    try {
      const openAIResponseRaw = openAIResponse.content[0].text.value;
      console.log('openAIResponseRaw', openAIResponseRaw);

      try {
        openAIResponseFormatted = JSON.parse(cleanJSON(openAIResponseRaw));
      } catch (error) {
        openAIResponseFormatted = { message: openAIResponseRaw };
      }
    } catch (error) {
      console.error('Error al parsear el JSON:', error);
      return { isError: true };
    }
    let textError;
    await this.chatGptThreadsService.updateThreadStatus(threadId, timeZone);

    if (openAIResponseFormatted?.message) {
      await this.chatGptThreadsService.createMessageByThrad(
        openAIResponseFormatted?.message,
        numberSender,
        true,
      );
    }

    const respToUser = textError ? textError : openAIResponseFormatted;
    return respToUser;
  }

  async hacerPedido({
    currentThreadId,
    clienteId,
    empresaId,
    openAIResponse,
    empresaType,
    clientName,
    numberSender,
    detalles,
    chatIdExist,
    messagePushTitle = 'Test 1',
    messagePush = 'Test',
    originalChatId,
    withIA = false,
  }: any) {
    try {
      console.log('openAIResponse', openAIResponse);
      const newOrder = await this.pedidoService.create({
        clienteId: clienteId,
        clientName: clientName,
        confirmado: false,
        estadoId: 1,
        products: openAIResponse.data,
        empresaType,
        detalles: detalles,
        numberSender,
        infoLinesJson: openAIResponse.infoLines,
        fecha: openAIResponse.fecha,
        messageToUser: openAIResponse?.messageToUser,
        chatId: chatIdExist,
        originalChatId: originalChatId,
        withIA: withIA,
      });
      // await this.chatGptThreadsService.deleteThread(currentThreadId);
      await this.deviceService.sendNotificationEmpresa(
        empresaId,
        messagePushTitle,
        messagePush,
      );
      return newOrder?.ok;
    } catch (error) {
      console.log('error haciendo pedido', error);
      return false;
    }
  }
}
