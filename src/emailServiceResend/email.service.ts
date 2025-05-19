import { Injectable } from "@nestjs/common";
import { Resend } from 'resend';

@Injectable()
export class EmailServiceResend {
    private readonly resend: Resend;

    constructor() {
        if (process.env.EMAIL_SERVICE_API_KEY) {
            this.resend = new Resend(process.env.EMAIL_SERVICE_API_KEY);
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
                        <a href="miapp://reset-password/${token}">Restablecer mi contraseña</a>
                    </div>
                </div>
                `,
            });

            if (error) {
                console.error('Error de Resend:', error);
                return { success: false, error };
            }

            console.log('Email sent successfully:', data);
            return { success: true, data };

        } catch (error: any) {
            console.log(error);
        }
    }
}
