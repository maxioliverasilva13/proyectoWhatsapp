import { OnQueueEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly mailerService: MailerService) {
    super();

  }

  async process(job: Job): Promise<void> {
    const { to, subject, template, context } = job.data;

    try {
      const resp = await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      console.log(`📧 Correo enviado a ${to}`);
      console.log('🟢 Respuesta:', resp);
    } catch (error) {
      console.error(`❌ Error al enviar correo: ${error.message}`);
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
