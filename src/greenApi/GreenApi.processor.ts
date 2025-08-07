import {
  OnQueueEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import type { Job } from 'bullmq';

@Processor(`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`, { concurrency: 5 })
export class GreenApiRetirveMessage extends WorkerHost {


  constructor() {
    console.log("Worker para GreenApiResponseMessagee registrado")
    super()
  }

  async process(job: any): Promise<any> {
    console.log('llego aca');
    const { message, chatId } = job.data;

    const payload = {
      chatId,
      message: message?.message,
    };

    const maxRetries = 3;
    let attempt = 0;

    console.log("xd1", process.env.ID_INSTANCE, process.env.API_TOKEN_INSTANCE)
    while (attempt < maxRetries) {
      try {
        console.log(`Intento ${attempt + 1}/${maxRetries} para enviar mensaje`);
        
        const resp = await fetch(
          `https://api.greenapi.com/waInstance${process.env.ID_INSTANCE}/sendMessage/${process.env.API_TOKEN_INSTANCE}`,
          {
            headers: { 
              'Content-Type': 'application/json',
              'User-Agent': 'WhatsApp-Bot/1.0'
            },
            method: 'POST',
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000), // 30 segundos timeout
          },
        );

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }

        const respF = await resp.json();
        console.log('✅ Mensaje enviado exitosamente:', respF);
        return { success: true, response: respF };
      } catch (error: any) {
        attempt++;
        console.error(`❌ Error en intento ${attempt}:`, {
          message: error.message,
          cause: error.cause?.message,
          code: error.cause?.code,
          hostname: error.cause?.hostname
        });

        if (attempt >= maxRetries) {
          console.error('❌ Máximo de reintentos alcanzado');
          return { 
            success: false, 
            error: error.message,
            details: {
              cause: error.cause?.message,
              code: error.cause?.code,
              hostname: error.cause?.hostname
            }
          };
        }

        // Esperar antes del siguiente intento (backoff exponencial)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  @OnQueueEvent("completed")
  onCompleted(job: Job) {
    console.log(`✅ Job ${job.id} completado.`);
  }

  @OnQueueEvent("failed")
  onFailed(job: Job, err: Error) {
    console.error(`🔥 Job ${job.id} falló: ${err.message}`);
  }
}
