import * as greenAPI from "@green-api/whatsapp-api-client";

export async function connectToGreenApi(): Promise < void> {    
    try {
        const restAPI = greenAPI.restAPI(({
            idInstance: process.env.ID_INSTANCE,
            apiTokenInstance: process.env.API_TOKEN_INSTANCE
        }));
        await restAPI.settings.setSettings({
            webhookUrl: `https://df7a-2800-a4-c1c3-b800-9154-99a6-1a5a-e0b9.ngrok-free.app/webhooks`
        });
        console.log('Conectado a Green APIii 4:');
    } catch(error) {
        console.error('Error al conectar con Green API:', JSON.stringify(error));
    }
}

