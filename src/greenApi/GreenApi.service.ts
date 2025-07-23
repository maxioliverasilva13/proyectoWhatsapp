import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ChatGptThreadsService } from 'src/chatGptThreads/chatGptThreads.service';
import { ClienteService } from 'src/cliente/cliente.service';
import { DeviceService } from 'src/device/device.service';
import { EspacioService } from 'src/espacio/espacio.service';
import { InfolineService } from 'src/infoline/infoline.service';
import { MensajeService } from 'src/mensaje/mensaje.service';
import { MenuImageService } from 'src/menuImg/menuImg.service';
import { PaymentMethodService } from 'src/paymentMethod/paymentMethod.service';
import { PedidoService } from 'src/pedido/pedido.service';
import { ProductoService } from 'src/producto/producto.service';
import { sendMessageWithTools } from 'src/utils/deepSeek/deepSeekFunctions';
import { connectToGreenApi } from 'src/utils/greenApi';

@Injectable()
export class GreenApiService {
  constructor(
    private readonly chatGptThreadsService: ChatGptThreadsService,
    private readonly pedidoService: PedidoService,
    private readonly clienteService: ClienteService,
    @Inject(forwardRef(() => ProductoService))
    private readonly productoService: ProductoService,
    private readonly infoLineService: InfolineService,
    private readonly deviceService: DeviceService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly messagesService: MensajeService,
    @Inject(forwardRef(() => MenuImageService))
    private readonly menuImageService: MenuImageService,
    private readonly espacioService: EspacioService,
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
    retiroEnSucursalEnabled,
    envioADomicilioEnabled,
    direccion,
  ) {
    let originalChatId = '';
    let chatIdWhatsapp = '';
    const {
      threadId,
      chatId: chatIdExist,
      originalChatId: originalChatFromThread,
    } = await this.chatGptThreadsService.getLastThreads(numberSender);
    if (originalChatFromThread) {
      originalChatId = originalChatFromThread;
    }

    console.log('obtengo el ultimo thread');

    if (chatIdExist) {
      console.log('ya hay un chat creado, es', chatId);

      chatIdWhatsapp = chatIdExist;
    } else {
      console.log('no hay un chat creado');
    }

    const { clienteId, clientName } =
      await this.clienteService.createOrReturnExistClient({
        empresaId: empresaId,
        nombre: senderName,
        telefono: numberSender,
      });

    let currentThreadId = threadId;

    if (!threadId) {
      const resp = await this.chatGptThreadsService.createThreads({
        numberPhone: numberSender,
        threadId: currentThreadId,
        chatId: chatId,
        originalChatId: originalChatId,
      });

      console.log('se creo el thrad');

      if (resp.thread.id) {
        currentThreadId = resp.thread.id;
      }
      if (resp?.thread?.originalChatId) {
        originalChatId = resp?.thread?.originalChatId;
      }
      if (resp.thread.chatId) {
        console.log('se creo el thrad bien, asignare chat id');
        chatIdWhatsapp = resp.thread.chatId;
      }
    }

    const messages = await this.chatGptThreadsService.createMessageByThrad(
      textMessage,
      numberSender,
      false,
    );

    const openAIResponse = await sendMessageWithTools(
      textMessage,
      messages,
      {
        productoService: this.productoService,
        pedidoService: this.pedidoService,
        paymentMethodService: this.paymentMethodService,
        greenApiService: this,
        infoLineService: this.infoLineService,
        messagesService: this.messagesService,
        clienteService: this.clienteService,
        menuImageService: this.menuImageService,
        espacioService: this.espacioService
      },
      {
        threadId,
        clienteId,
        empresaId,
        empresaType,
        clientName,
        numberSender,
        chatIdExist: chatIdWhatsapp,
        originalChatId,
        retiroEnSucursalEnabled: retiroEnSucursalEnabled,
        envioADomicilioEnabled: envioADomicilioEnabled,
        timeZone,
        senderName: senderName,
        userId: clienteId,
        direccion: direccion,
      },
    );

    if (!openAIResponse) {
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

    try {
      const openAIResponseRaw = cleanJSON(openAIResponse);

      try {
        const cleaned = openAIResponseRaw.replace(/\\"/g, '"');

        openAIResponseFormatted = JSON.parse(cleaned);
      } catch (error) {
        openAIResponseFormatted = { message: openAIResponseRaw };
      }
    } catch (error) {
      console.error('Error al parsear el JSON:', error);
      return { isError: true };
    }
    let textError;
    await this.chatGptThreadsService.updateThreadStatus(threadId, timeZone);

    console.log('openAIResponseFormatted', openAIResponseFormatted);
    const respToUser = textError ? textError : openAIResponseFormatted;

    console.log('devolvere respToUser', respToUser);

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
    paymentMethodId = '',
    transferUrl = '',
    userId = '',
    isDomicilio = false,
    espacio_id = null,
    timeZone
  }: any) {
    try {
      const newOrder = await this.pedidoService.create({
        clienteId: clienteId,
        clientName: clientName,
        confirmado: false,
        estadoId: 1,
        products: openAIResponse.data,
        empresaType,
        detalles: detalles,
        transferUrl: transferUrl,
        numberSender,
        infoLinesJson: openAIResponse.infoLines,
        fecha: openAIResponse.fecha,
        messageToUser: openAIResponse?.messageToUser,
        chatId: chatIdExist,
        originalChatId: originalChatId,
        withIA: withIA,
        paymentMethodId: paymentMethodId,
        userId: userId,
        isDomicilio: isDomicilio,
        espacio_id: espacio_id,
        timeZone: timeZone
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
      return {
        ok: false,
        message: error?.message ?? 'Erro inesperado creando orden',
      };
    }
  }

  async sendImageToChat(chatIdWhatsapp: string, imageUrl: string) {
    console.log('Enviando imagen...');

    const payload = {
      chatId: chatIdWhatsapp,
      urlFile: imageUrl,
      fileName: 'imagen.jpg',
      caption: '',
    };

    try {
      const resp = await fetch(
        `https://api.greenapi.com/waInstance${process.env.ID_INSTANCE}/sendFileByUrl/${process.env.API_TOKEN_INSTANCE}`,
        {
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const respF = await resp.json();
      console.log('respF', respF);
      return { success: true };
    } catch (error: any) {
      console.log('Error al enviar imagen');
      console.log(error?.response?.data?.message ?? error);
      return { success: false };
    }
  }
}
