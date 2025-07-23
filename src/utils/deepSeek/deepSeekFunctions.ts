import getCurrentDate from '../getCurrentDate';
import { getInstructions } from './instructions';
import { Customtools } from './tools';

type ToolCallFunction = {
  name: string;
  arguments: string;
};

interface Services {
  productoService: any;
  pedidoService: any;
  paymentMethodService: any;
  greenApiService: any;
  infoLineService: any;
  messagesService: any;
  clienteService: any;
  menuImageService: any;
  espacioService: any
}

interface Context {
  threadId: number;
  direccion?: string;
  clienteId: any;
  retiroEnSucursalEnabled?: boolean;
  empresaId: any;
  envioADomicilioEnabled?: boolean;
  empresaType: any;
  clientName: any;
  numberSender: any;
  chatIdExist: any;
  originalChatId?: string;
  timeZone: string;
  senderName: any;
  userId: any;
}

function sanitizeMessages(messages: any[]) {
  return messages.filter((msg) => {
    if (msg.role === 'assistant') {
      return msg.content || (msg.tool_calls && msg.tool_calls.length > 0);
    }
    if (msg.role === 'tool') {
      return msg.content && msg.tool_call_id;
    }
    return msg.content;
  });
}

async function executeToolByName(
  name: string,
  args: any,
  services: Services,
  context: Context,
) {
  const {
    productoService,
    pedidoService,
    paymentMethodService,
    greenApiService,
    infoLineService,
    menuImageService
  } = services;

  
  const {
    threadId,
    clienteId,
    empresaId,
    empresaType,
    clientName,
    numberSender,
    chatIdExist,
    originalChatId,
    timeZone,
    senderName,
    userId,
  } = context;

  let toolResult: any;

  console.log('intentando llamar a funcion', name);

  console.log('args', args);
  if (name === 'getProductosImgs') {
    console.log('getProductosImgs');
    toolResult = await menuImageService.listProductsImages(chatIdExist);
  } else if (name === 'getProductsByEmpresa') {
    console.log('getProductsByEmpresa');
    toolResult = await productoService.findAllInText(chatIdExist);
  } else if (name === 'getPedidosByUser') {
    console.log('getPedidosByUser');
    toolResult = await pedidoService.getMyOrders(clienteId);
  } else if (name === 'getPaymentMethods') {
    console.log('getPaymentMethods');
    toolResult = await paymentMethodService.findAll();
  } else if (name === 'getInfoLines') {
    console.log('getInfoLines');
    toolResult = await infoLineService.findAllFormatedText(empresaType);
  } else if (name === 'editOrder') {
    console.log('editOrder');
    toolResult = await pedidoService.update(args.orderId, args.order);
  } else if (name === 'createReclamo') {
    console.log('createReclamo');
    const resp = await pedidoService.createReclamo(
      args.pedidoId,
      args.reclamoText,
    );
    toolResult = resp.ok;
  } else if (name === 'cancelOrder') {
    console.log('cancelOrder');
    toolResult = await pedidoService.remove(args.orderId);
  } else if (name === 'getDailyMenu') {
    console.log('getDailyMenu');
    toolResult = await productoService.findAllInTextDailyMenu(args.dayOfWeek);
  } else if (name === 'getCurrencies') {
    console.log('getCurrencies');
    toolResult = await productoService.getCurrencies();
  } else if (name === 'confirmOrder') {
    console.log('confirmOrder');
    console.log('intentando crear orden con', args, args?.info?.data);

    toolResult = await greenApiService.hacerPedido({
      currentThreadId: threadId,
      transferUrl: args?.transferUrl ?? '',
      clienteId,
      empresaId,
      detalles: args.detalles ?? args.info?.detalles,
      openAIResponse: args.info,
      empresaType,
      clientName,
      numberSender,
      chatIdExist,
      messagePushTitle: args.messagePushTitle,
      messagePush: args.messagePush,
      originalChatId,
      withIA: true,
      paymentMethodId: args?.paymentMethodId,
      userId: args?.info?.empleadoId,
      isDomicilio: args?.isDomicilio ?? false,
      espacio_id: args?.espacio_id ?? null,
      timeZone
    });
  } else if (name === 'getAvailability') {
    console.log('getAvailability');
    toolResult = await pedidoService.obtenerDisponibilidadActivasByFecha(
      args.date,
      false,
      args.empleadoId ? args.empleadoId : args.espacio_id,
      empresaType === 'RESERVAS DE ESPACIO'
    );
  } else if (name === 'getNextAvailability') {
    console.log('getNextAvailability');
    toolResult = await pedidoService.getNextDateTimeAvailable(
      timeZone,
      args.empleadoId ? args.empleadoId : args.espacio_id,
      empresaType === 'RESERVAS DE ESPACIO'
    );
  } else {
    toolResult = { error: `Tool ${name} no implementada` };
  }

  return toolResult;
}

export async function sendMessageWithTools(
  msg: string | null,
  messages: any[],
  services: Services,
  context: Context,
): Promise<string> {
  // Fetch static data in parallel
  const [usersEmpresa, menuImagesCount] = await Promise.all([
    services.clienteService.findUsersByEmpresa(context.empresaId),
    services.menuImageService.getCantidadImages(),
  ]);

  const esp_text = await services.espacioService.findAllPlainText()

  // Prepare base formatted text string once
  const formatedText =
    `DIRECCION_EMPRESA: ${context.direccion}\n` +
    `RETIRO_SUCURSAL_ENABLED: ${context.retiroEnSucursalEnabled ? 'true' : 'false'}\n` +
    `ENVIO_DOMICILIO_ENABLED: ${context.envioADomicilioEnabled ? 'true' : 'false'}\n` +
    `EmpresaId: ${context.empresaId}\n` +
    `EmpresaType: ${context.empresaType}\n` +
    `UserId: ${context.userId}\n` +
    `Nombre de usuario: ${context.senderName}\n` +
    `CURRENT_TIME: ${getCurrentDate()}\n` +
    `CANT_IMAGES_PROD: ${menuImagesCount}\n` +
    `CURRENT_EMPLEADOS: ${JSON.stringify(usersEmpresa ?? [])}\n` +
    `ESPACIOS_DISPONIBLES: ${esp_text}\n`
    ;

  let currentMessages = [...messages];
  if (msg) {
    currentMessages.push({ role: 'user', content: msg });
  }

  let maxIterations = 10;
  let lastMessageContent: string | null = null;

  while (maxIterations-- > 0) {
    if (hasUnrespondedToolCalls(currentMessages)) {
      console.warn('[⚠️] Tool calls pendientes sin responder. Deteniendo el ciclo.');
      break;
    }

    const instructions = await getInstructions(context.empresaType);

    const chatMessages = sanitizeMessages([
      { role: 'system', content: instructions },
      { role: 'system', content: formatedText },
      ...currentMessages,
    ]);

    console.log('[Enviando solicitud DeepSeek] Iteración restante:', maxIterations);
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: chatMessages,
        tools: Customtools(context.empresaType),
        tool_choice: 'auto',
        max_tokens: 4096,
        temperature: 0.1,
        stream: false,
      }),
    });
    const data = await response.json();
    console.log('[Respuesta API]', JSON.stringify(data, null, 2));

    const message = data?.choices?.[0]?.message;
    if (!message) {
      console.warn('[⚠️] No se recibió mensaje de DeepSeek.');
      break;
    }

    lastMessageContent = message.content ?? lastMessageContent;

    if (message.tool_calls?.length) {
      await services.messagesService.createToolCallsMessage({
        tool_calls: message.tool_calls,
        chat: context.originalChatId,
      });
      currentMessages.push({
        role: 'assistant',
        tool_calls: message.tool_calls,
        ...(message.content && { content: message.content }),
      });

      for (const tc of message.tool_calls) {
        let args = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}');
        } catch (e) {
          console.error('[Error parseando args de tool]', e);
        }

        const output = await executeToolByName(
          tc.function.name,
          args,
          services,
          context,
        );
        const content = typeof output === 'string' ? output : JSON.stringify(output);

        await services.messagesService.createToolMessage({
          mensaje: content,
          toolCallId: tc.id,
          chat: context.originalChatId,
        });

        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content,
        });
      }

      continue;
    }

    if (message.content) {
      console.log('[Respuesta final del asistente]', message.content);
      return message.content;
    }
  }

  console.log('[Fin sin respuesta clara] Último contenido:', lastMessageContent);
  return lastMessageContent || 'No pude generar una respuesta';
}

function hasUnrespondedToolCalls(messages: any[]): boolean {
  const reversed = [...messages].reverse();
  const lastAssistantWithTools = reversed.find(
    (m) => m.role === 'assistant' && m.tool_calls?.length > 0,
  );
  if (!lastAssistantWithTools) return false;
  const index = messages.indexOf(lastAssistantWithTools);
  const toolCallIds = lastAssistantWithTools.tool_calls.map((tc: any) => tc.id);
  const nextMessages = messages.slice(index + 1);
  return !toolCallIds.every((id) =>
    nextMessages.some((m) => m.role === 'tool' && m.tool_call_id === id),
  );
}
