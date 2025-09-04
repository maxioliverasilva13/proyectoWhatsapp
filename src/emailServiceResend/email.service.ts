import { BadRequestException, Injectable } from "@nestjs/common";
import { Resend } from 'resend';

@Injectable()
export class EmailServiceResend {
  private readonly resend: Resend;

  constructor() {
    if (process.env.RESEND_KEY) {
      this.resend = new Resend(process.env.RESEND_KEY);
    }
  }

  async sendVerificationCodeEmail(email: string, token: any) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: 'noreply@measyapp.com',
        to: [email],
        subject: 'Your reset autorization',
        html: `
<div style="background-color: #f4f4f4; padding: 40px 20px; font-family: Arial, sans-serif; text-align: center;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h2 style="color: #111111; margin-bottom: 20px;">Restablecer tu contraseña</h2>
    
    <p style="color: #333333; font-size: 16px; margin-bottom: 30px;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para continuar:
    </p>

<a
  href="https://${process.env.VIRTUAL_HOST}/auth/open-reset-link?token=${token}
  style="display: inline-block; background-color: #128c7e; color: #fff;
        text-decoration: none; font-size: 16px; padding: 12px 25px; 
        border-radius: 5px; font-weight: bold;"
>
  Restablecer contraseña
</a>

    <p style="color: #999999; font-size: 12px; margin-top: 40px;">
      Si no solicitaste este cambio, puedes ignorar este correo.
    </p>
  </div>
</div>

                `,
      });

      if (error) {
        throw new BadRequestException('No hay variable de entorno')
      }

      return { success: true, data };

    } catch (error: any) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: process.env.RESEND_KEY ? error?.message : "No hay varia ble de entorno",
        error: 'Bad Request',
      });
    }
  }

  async sendCustomEmail(from: string, to: string, subject: string, message: string, isHtml: boolean = false) {
    try {
      if (!this.resend) {
        throw new BadRequestException('Resend service not initialized. Check RESEND_KEY environment variable.');
      }

      const emailData: any = {
        from,
        to: [to],
        subject,
      };

      if (isHtml) {
        emailData.html = message;
      } else {
        emailData.text = message;
      }

      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        throw new BadRequestException(`Error sending email: ${error.message}`);
      }

      return { 
        success: true, 
        data,
        message: `Email sent successfully to ${to}` 
      };

    } catch (error: any) {
      throw new BadRequestException({
        ok: false,
        statusCode: 400,
        message: error?.message || 'Error sending custom email',
        error: 'Bad Request',
      });
    }
  }
}
