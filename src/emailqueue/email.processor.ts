import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('email')
export class EmailProcessor {
  constructor(private readonly mailerService: MailerService) {}

  @Process('sendEmail')
  async handleSendEmail(job: Job) {
    const { to, subject, text } = job.data;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        text,
      });
      console.log(`Correo enviado a ${to}`);
    } catch (error) {
      console.error(`Error al enviar correo: ${error.message}`);
    }
  }
}
