import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email')
export class EmailProcessor {
  constructor(private readonly mailerService: MailerService) {}

  @Process('sendEmail')
  async handleSendEmail(job: Job) {
    const { to, subject, template, context } = job.data;

    try {
      const resp = await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      console.log(`Correo enviado a ${to}`);
      console.log("resp", resp)
    } catch (error) {
      console.error(`Error al enviar correo: ${error.message}`);
    }
  }
}
