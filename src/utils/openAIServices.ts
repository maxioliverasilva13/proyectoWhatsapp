import getCurrentDate from "./getCurrentDate";
import * as moment from 'moment-timezone';
import * as FormData from 'form-data';
import { Readable } from "stream";

export const askAssistant = async (question, instrucciones) => {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPEN_AI_TOKEN}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system", content: [
                            instrucciones.instructions,
                            " Mensajes anteriores",
                        ]
                    },
                    { role: "user", content: question }
                ],
            })
        });
        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error('Error al enviar la pregunta: ' + JSON.stringify(errorResponse));
        }

        const data = await response.json() as any;
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Error al interactuar con el asistente:", error.message);
    }
};

export async function createThread(products, infoLines, empresaType) {
        
    const formatedText = `empresaType: ${empresaType}\nINFO-LINES: ${infoLines}\nLISTA-PRODUCTOS: ${products}\n CURRENT_TIME:${getCurrentDate()}`
    
    const response = await fetch(`https://api.openai.com/v1/threads`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPEN_AI_TOKEN}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
            messages: [
                {role: "assistant",content: formatedText}
            ]
        }),    
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Error al crear el thread: ${JSON.stringify(errorResponse)}`);
    }    

    const threadData = await response.json() as any;
    console.log("thread creado");
    
    return threadData.id;
}

export async function sendMessageToThread(threadId, text, isAdmin, timeZone) {

    const today = moment.tz(timeZone); 
    const headers = {
        "Authorization": `Bearer ${process.env.OPEN_AI_TOKEN}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
    };

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            role: "user",
            content: `Admin:${isAdmin} \n Current_Time:${today} \n Message: ${text}`
        })
    });
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            assistant_id: process.env.ASSISTANT_ID
        })
    });


    if (!response.ok) {
        const errorData = await response.json();
        console.error(errorData);
        throw new Error("Error al enviar el mensaje al hilo: " + response.statusText);
    }

    const runData = await response.json() as any;
    const runId = runData.id;

    let delay = 300;
    let status = "pending";
    const maxRetries = 10;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        await new Promise(resolve => setTimeout(resolve, delay));

        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
            headers
        });

        if (!statusResponse.ok) {
            console.warn("Reintentando después de un error de estado:", statusResponse.statusText);
            continue;
        }

        const statusData = await statusResponse.json() as any;
        status = statusData.status;

        if (status === "completed") break;
        delay = Math.min(3000, delay + 500);
    }

    if (status !== "completed") {
        throw new Error("La ejecución no se completó correctamente.");
    }

    // Recuperar el último mensaje del asistente
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?role=assistant&limit=1`, {
        headers
    });

    if (!messagesResponse.ok) {
        throw new Error("Error al obtener los mensajes del hilo: " + messagesResponse.statusText);
    }

    const messagesData = await messagesResponse.json() as any;
    const assistantMessage = messagesData.data[0];

    if (!assistantMessage) {
        throw new Error("No se encontró una respuesta del asistente.");
    }    
    return assistantMessage;
}


export async function closeThread(threadId) {
    const url = `https://api.openai.com/v1/threads/${threadId}`;
    const headers = {
        "Authorization": `Bearer ${process.env.OPEN_AI_TOKEN}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
    };

    const response = await fetch(url, {
        method: "DELETE",
        headers
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
            throw new Error(`Error al descargar el audio: ${responseAudio.statusText}`);
        }

        const audioBuffer = Buffer.from(await responseAudio.arrayBuffer());

        const readableStream = new Readable();
        readableStream.push(audioBuffer);
        readableStream.push(null);

        const formData = new FormData();
        formData.append('file', readableStream, {
            filename: 'audio.wav', 
            contentType: 'audio/wav'
        });
        formData.append('model', 'whisper-1'); 

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPEN_AI_TOKEN}`, 
                ...formData.getHeaders(),
            },
            body: formData as any,
        });

        if (!response.ok) {
            throw new Error(`error en la traduccion: ${await response.text()}`);
        }

        const data = await response.json() as any;
        return data.text;
    } catch (error) {
        console.error('Error:', error);
    }
};