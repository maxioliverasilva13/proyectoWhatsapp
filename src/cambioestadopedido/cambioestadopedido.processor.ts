import {
    OnQueueEvent,
    Processor,
    WorkerHost,
} from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor(`sendMessageChangeStatusOrder-${process.env.SUBDOMAIN}`, { concurrency: 5 })
export class SendMessageChangeStatusOrder extends WorkerHost {

    constructor() {
        console.log("Worker para sendMessageChangeStatusOrder registrado")
        super()
    }

    async process(job: Job) {
        const { message, chatId } = job.data;

        const payload = {
            chatId,
            message: message,
        };

        console.log(process.env.ID_INSTANCE, process.env.API_TOKEN_INSTANCE);
        try {
            const resp = await fetch(
                `https://api.greenapi.com/waInstance${process.env.ID_INSTANCE}/sendMessage/${process.env.API_TOKEN_INSTANCE}`,
                {
                    headers: { 'Content-Type': 'application/json' },
                    method: 'POST',
                    body: JSON.stringify(payload),
                },
            );

            const respF = await resp.json();

            console.log(respF);
            

            return { success: true };
        } catch (error: any) {
            console.log(error?.response?.data?.message ?? error);
            return { success: false };
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
