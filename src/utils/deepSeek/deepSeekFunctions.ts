import { toolresults } from 'googleapis/build/src/apis/toolresults';
import getCurrentDate from '../getCurrentDate';
import { instructions } from './instructions';
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
}

interface Context {
  threadId: number;
  clienteId: any;
  empresaId: any;
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
  if (name === 'getProductsByEmpresa') {
    console.log('getProductsByEmpresa');
    toolResult = await productoService.findAllInText();
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
  } else if (name === 'getCurrencies') {
    console.log('getCurrencies');
    toolResult = await productoService.getCurrencies();
  } else if (name === 'confirmOrder') {
    console.log('confirmOrder');
    toolResult = await greenApiService.hacerPedido({
      currentThreadId: threadId,
      transferUrl: args?.transferUrl ?? '',
      clienteId,
      empresaId,
      detalles: args.detalles,
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
    });
  } else if (name === 'getAvailability') {
    console.log('getAvailability');
    toolResult = await pedidoService.obtenerDisponibilidadActivasByFecha(
      args.date,
      false,
      args.empleadoId,
    );
  } else if (name === 'getNextAvailability') {
    console.log('getNextAvailability');
    toolResult = await pedidoService.getNextDateTimeAvailable(
      timeZone,
      args.empleadoId,
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
  const usersEmpresa = await services.clienteService.findUsersByEmpresa(
    context.empresaId,
  );
  const formatedText = `EmpresaId: ${context.empresaId} \n EmpresaType: ${context.empresaType} \n UserId: ${context.userId} \n Nombre de usuario: ${context.senderName} \n
    CURRENT_TIME:${getCurrentDate()}\n CURRENT_EMPLEADOS:${JSON.stringify(usersEmpresa ?? '[]')} \n`;

  console.log('formatedText', formatedText);
  let currentMessages = [...messages];

  if (msg) {
    currentMessages.push({ role: 'user', content: msg });
  }

  let maxIterations = 5;
  let lastMessage = null;

  while (maxIterations-- > 0) {
    const currentMessagesSlices = currentMessages.slice(-10);
    const chatMessages = sanitizeMessages([
      { role: 'system', content: instructions },
      { role: 'system', content: formatedText },
      ...currentMessagesSlices,
    ]);

    console.log('[Iteración]', 5 - maxIterations);
    console.log('[Enviando mensajes]');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: chatMessages,
        tools: [...Customtools],
        tool_choice: 'auto',
        max_tokens: 4096,
        temperature: 0.5,
        stream: false,
      }),
    });

    const data = await response.json();
    console.log('[Respuesta API]', JSON.stringify(data, null, 2));

    const message = data?.choices?.[0]?.message;
    lastMessage = message;

    if (message?.tool_calls?.length > 0) {
      console.log('[Tool Calls detectadas]', message.tool_calls);

      await services.messagesService.createToolCallsMessage({
        tool_calls: message.tool_calls,
        chat: context.originalChatId,
      });

      currentMessages.push({
        role: 'assistant',
        ...(message.tool_calls && { tool_calls: message.tool_calls }),
        ...(message.content && { content: message.content }),
      });

      for (const toolCall of message.tool_calls) {
        const { name, arguments: rawArgs } = toolCall.function;
        let args = {};
        try {
          args = JSON.parse(rawArgs);
        } catch (e) {
          console.error('[Error al parsear argumentos de tool]', e);
        }

        console.log('[Ejecutando tool]', name, args);

        const toolOutput = await executeToolByName(
          name,
          args,
          services,
          context,
        );

        const toolOutputString =
          typeof toolOutput === 'string'
            ? toolOutput
            : typeof toolOutput === 'object'
              ? JSON.stringify(toolOutput)
              : String(toolOutput);

        await services.messagesService.createToolMessage({
          mensaje: toolOutputString,
          toolCallId: toolCall.id,
          chat: context.originalChatId,
        });

        console.log('[Tool output generado]', toolCall.id, toolOutputString);

        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolOutputString,
        });
      }

      continue; // Volver a iterar con las respuestas de tools
    }

    if (message?.content) {
      console.log('[Respuesta final del asistente]', message.content);
      return message.content;
    }
  }

  console.log('[Fin sin respuesta clara]', lastMessage);
  return lastMessage?.content || 'No pude generar una respuesta';
}
