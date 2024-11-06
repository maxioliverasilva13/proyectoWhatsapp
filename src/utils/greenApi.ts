import * as greenAPI from "@green-api/whatsapp-api-client";

export async function connectToGreenApi(): Promise < void> {    
    try {
        const restAPI = greenAPI.restAPI(({
            idInstance: process.env.ID_INSTANCE,
            apiTokenInstance: process.env.API_TOKEN_INSTANCE
        }));

        await restAPI.settings.setSettings({
            webhookUrl: `https://dc5b-186-54-196-179.ngrok-free.app/webhooks`
        });
        console.log('Conectado a Green API:');
    } catch(error) {
        console.error('Error al conectar con Green API:', error.message);
    }
}
