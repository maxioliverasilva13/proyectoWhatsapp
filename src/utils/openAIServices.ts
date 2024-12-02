
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

        const data = await response.json();
        console.log("Respuesta del asistente:", data.choices[0].message.content);
        return data.choices[0].message.content;

    } catch (error) {
        console.error("Error al interactuar con el asistente:", error.message);
    }
};

export async function createThread(products, infoLines) {
    
    const formatedText = `INFO-LINES: ${infoLines}.\nLISTA-PRODUCTOS: \n ${products}.`
    
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

    const threadData = await response.json();
    console.log("thread creado");
    
    return threadData.id;
}

export async function sendMessageToThread(threadId, text, tipoEmpresa) {

    console.log(tipoEmpresa);
    
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
            content: text
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

    const runData = await response.json();
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

        const statusData = await statusResponse.json();
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

    const messagesData = await messagesResponse.json();
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


