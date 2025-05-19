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
                from: 'noreply@whatsproy.com',
                to: [email],
                subject: 'Your reset autorization',
                html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #fff;">
                    <div style="max-width: 500px; background: #000; color: #fff; padding: 30px 20px; border-radius: 8px; margin: auto;">
                        <h2 style="margin-bottom: 10px;">Reset your password</h2>
                        <a href="miapp://reset-password?token=${token}">Restablecer mi contraseña</a>
                    </div>
                </div>
                `,
            });

            if (error) {
                if (process.env.RESEND_KEY) {
                    throw new BadRequestException('')

                } else {
                    throw new BadRequestException('No hay variable de entorno')
                }
            }

            console.log('Email sent successfully:', data);
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
}
