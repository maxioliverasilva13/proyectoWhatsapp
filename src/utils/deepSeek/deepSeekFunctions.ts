import getCurrentDate from "../getCurrentDate";
import { instructions } from "./instructions";
import { Customtools } from "./tools";

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
    messagesService: any
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
    senderName: any
    userId: any
}

async function executeToolByName(
    name: string,
    args: any,
    services: Services,
    context: Context
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
        userId
    } = context;

    let toolResult: any;

    if (name === 'getProductsByEmpresa') {
        console.log('siii, debo de traer prouctos jasjsasjaasjasjasjjsajassjasjasjas');

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
        const resp = await pedidoService.createReclamo(args.pedidoId, args.reclamoText);
        toolResult = resp.ok;
    } else if (name === 'cancelOrder') {
        console.log('cancelOrder');
        toolResult = await pedidoService.cancel(args.orderId, true);
    } else if (name === 'getCurrencies') {
        console.log('getCurrencies');
        toolResult = await productoService.getCurrencies();
    } else if (name === 'confirmOrder') {
        console.log('confirmOrder');
        toolResult = await greenApiService.hacerPedido({
            currentThreadId: threadId,
            transferUrl: args?.transferUrl ?? "",
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
        });
    } else if (name === 'getAvailability') {
        console.log('getAvailability');
        toolResult = await pedidoService.obtenerDisponibilidadActivasByFecha(args.date);
    } else if (name === 'getNextAvailability') {
        console.log('getNextAvailability');
        toolResult = await pedidoService.getNextDateTimeAvailable(timeZone);
    } else {
        toolResult = { error: `Tool ${name} no implementada` };
    }

    return toolResult;
}


export async function sendMessageWithTools(
    msg: string | null,
    messages: any[],
    services: Services,
    context: Context
): Promise<string> {
    const formatedText = `EmpresaId: ${context.empresaId} \n EmpresaType: ${context.empresaType} \n UserId: ${context.userId} \n Nombre de usuario: ${context.senderName} \n
    CURRENT_TIME:${getCurrentDate()} \n`;

    const chatMessages = [
        { role: 'system', content: instructions },
        { role: 'system', content: formatedText },
        ...messages
    ];

    // console.log(chatMessages);
    
    if (msg) {
        chatMessages.push({ role: 'user', content: msg });
    }

    console.log("variable es ", process.env.DEEPSEEK_TOKEN)
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
            tool_choice: "auto",
            max_tokens: 4096,
            temperature: 0.5,
            stream: false,
            response_format: {
                type: "json_object"
            }
        }),
    });

    const data = await response.json();

    const message = data?.choices?.[0]?.message;

    if (!message) {
        console.error("⚠️ Respuesta inesperada de DeepSeek:", JSON.stringify(data, null, 2));
        throw new Error("La respuesta del modelo no contiene mensaje");
    }

    if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('chatiidexist es ', context.chatIdExist);
        
        await services.messagesService.createToolCallsMessage({
            tool_calls: message.tool_calls,
            chat: context.originalChatId
        })

        messages.push({
            role: 'assistant',
            content: "envio de tools",
            tool_calls: message.tool_calls
        })


        for (const toolCall of message.tool_calls) {
            const { name, arguments: rawArgs } = toolCall.function;
            let args = {};
            try {
                args = JSON.parse(rawArgs);
            } catch (e) {
                console.error('Error parsing tool call arguments', e);
            }

            const toolOutput = await executeToolByName(name, args, services, context);

            messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(toolOutput),
            });

            await services.messagesService.createToolMessage({
                mensaje: JSON.stringify(toolOutput),
                toolCallId: toolCall.id,
                chat: context.originalChatId
            })
        }
        return sendMessageWithTools(null, messages, services, context);
    }

    return message.content;
}



