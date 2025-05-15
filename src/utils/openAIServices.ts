import getCurrentDate from './getCurrentDate';
import * as moment from 'moment-timezone';
import * as FormData from 'form-data';
import { Readable } from 'stream';
import axios from 'axios';
import { ProductoService } from 'src/producto/producto.service';
import { PedidoService } from 'src/pedido/pedido.service';
import { GreenApiService } from 'src/greenApi/GreenApi.service';
import { InfolineService } from 'src/infoline/infoline.service';

export const askAssistant = async (question, instrucciones) => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: [instrucciones.instructions, ' Mensajes anteriores'],
          },
          { role: 'user', content: question },
        ],
      }),
    });
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(
        'Error al enviar la pregunta: ' + JSON.stringify(errorResponse),
      );
    }

    const data = (await response.json()) as any;
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error al interactuar con el asistente:', error.message);
  }
};

export async function createThread(empresaType, empresaId = '', userId) {
  const formatedText = `EmpresaId: ${empresaId} \n EmpresaType: ${empresaType} \n UserId: ${userId} \n
    CURRENT_TIME:${getCurrentDate()} \n`;

  const response = await fetch(`https://api.openai.com/v1/threads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({
      messages: [{ role: 'assistant', content: formatedText }],
    }),
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    throw new Error(
      `Error al crear el thread: ${JSON.stringify(errorResponse)}`,
    );
  }

  const threadData = (await response.json()) as any;
  console.log('thread creado');

  return threadData.id;
}

export async function sendMessageToThread(
  threadId,
  text,
  isAdmin,
  timeZone,
  productoService: ProductoService,
  pedidoService: PedidoService,
  greenApiService: GreenApiService,
  infoLineService: InfolineService,
  empresaId: any,
  clienteId: any,
  empresaType: any,
  clientName: any,
  numberSender: any,
  chatIdExist: any,
  clientId: any,
  originalChatId?: string,
) {
  const today = moment.tz(timeZone);
  const headers = {
    Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  };

  // 1. Enviar mensaje
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      role: 'user',
      content: `Message: ${text}`,
    }),
  });

  // 2. Lanzar assistant run
  const response = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/runs`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        assistant_id: process.env.ASSISTANT_ID,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error al iniciar el run:', errorData);
    return { isError: true };
  }

  const runData = await response.json();
  const runId = runData.id;

  const maxRetries = 30;
  let delay = 2000;
  let status = 'queued';
  const maxToolCallRetries = 3;
  let toolCallAttempts = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delay));

    const statusResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers },
    );

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();
    status = statusData.status;

    if (
      status === 'requires_action' &&
      statusData.required_action?.submit_tool_outputs?.tool_calls
    ) {
      const toolCalls =
        statusData.required_action.submit_tool_outputs.tool_calls;

      const tool_outputs = [];

      for (const toolCall of toolCalls) {
        const { name, arguments: rawArgs } = toolCall.function;

        let args: any = {};
        try {
          args = JSON.parse(rawArgs);
        } catch (err) {
          console.error('Error al parsear los argumentos:', rawArgs);
        }

        let toolResult;
        try {
          if (name === 'getProductsByEmpresa') {
            console.log('getProductsByEmpresa');
            toolResult = await productoService.findAllInText();
          } else if (name === 'getPedidosByUser') {
            console.log('getPedidosByUser');
            toolResult = await pedidoService.getMyOrders(clienteId);
          } else if (name === 'getInfoLines') {
            console.log('getInfoLines');
            const textInfoLines =
              await infoLineService.findAllFormatedText(empresaType);
            toolResult = textInfoLines;
          } else if (name === 'editOrder') {
            console.log('editOrder');
            const resp = await pedidoService.update(args.orderId, args.order);
            toolResult = resp;
          } else if (name === 'getCurrencies') {
            console.log('getCurrencies');
            toolResult = await productoService.getCurrencies();
          } else if (name === 'confirmOrder') {
            toolResult = await greenApiService.hacerPedido({
              currentThreadId: threadId,
              clienteId: clientId,
              empresaId: empresaId,
              detalles: args.detalles,
              openAIResponse: args.info,
              empresaType: empresaType,
              clientName: clientName,
              numberSender: numberSender,
              chatIdExist: chatIdExist,
              messagePushTitle: args.messagePushTitle,
              messagePush: args.messagePush,
              originalChatId: originalChatId,
              withIA: true,
            });
          } else if (name === 'getAvailability') {
            console.log('getAvailability');
            toolResult =
              await pedidoService.obtenerDisponibilidadActivasByFecha(
                args.date,
              );
          } else if (name === 'getNextAvailability') {
            console.log('getNextAvailability');
            toolResult = await pedidoService.getNextDateTimeAvailable(timeZone);
          } else {
            toolResult = { error: `Tool ${name} no implementada` };
          }
        } catch (err) {
          toolResult = { error: 'Error ejecutando la función' };
        }

        let toolOutputStr;
        try {
          toolOutputStr = JSON.stringify(
            toolResult ?? { error: 'Respuesta vacía' },
          );
        } catch (err) {
          console.error('Error serializando resultado:', err);
          toolOutputStr = JSON.stringify({
            error: 'Error serializando toolResult',
          });
        }

        tool_outputs.push({
          tool_call_id: toolCall.id,
          output: toolOutputStr,
        });
      }

      const submitRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ tool_outputs }),
        },
      );

      const submitData = await submitRes.json();

      if (!submitRes.ok) {
        console.error('Error al enviar tool output:', submitData);
        return { isError: true };
      }

      toolCallAttempts++;
      if (toolCallAttempts > maxToolCallRetries) {
        console.error('Demasiadas llamadas a la misma herramienta');
        return { isError: true };
      }

      attempt = 0;
      delay = 1000;
      continue;
    }

    if (status === 'completed') break;

    delay = Math.min(3000, delay + 500);
  }

  if (status !== 'completed') {
    console.log('run no completado, status:', status);
    return { ok: false };
  }

  const messagesResponse = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages?role=assistant&limit=1`,
    { headers },
  );

  if (!messagesResponse.ok) {
    console.log('Error al obtener los mensajes del asistente');
    return { isError: true };
  }

  const messagesData = await messagesResponse.json();
  const assistantMessage = messagesData.data[0];

  return assistantMessage ?? { isError: true };
}

export async function closeThread(threadId) {
  const url = `https://api.openai.com/v1/threads/${threadId}`;
  const headers = {
    Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2',
  };

  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(errorData);
    throw new Error(`Error al cerrar el hilo: ${response.statusText}`);
  }

  console.log(`Thread ${threadId} cerrado exitosamente.`);
  return await response.json();
}

export const SpeechToText = async (audioUrl: string) => {
  try {
    const responseAudio = await fetch(audioUrl);
    if (!responseAudio.ok) {
      throw new Error(
        `Error al descargar el audio: ${responseAudio.statusText}`,
      );
    }

    const audioBuffer = Buffer.from(await responseAudio.arrayBuffer());

    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null);

    const formData = new FormData();
    formData.append('file', stream, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    formData.append('model', 'whisper-1');

    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_TOKEN}`,
          ...formData.getHeaders(),
        },
      },
    );

    return response.data.text;
  } catch (error: any) {
    console.error('Error:', error?.response?.data || error.message);
  }
};
