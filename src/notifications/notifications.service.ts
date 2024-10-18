import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

interface NotificationQueue {
    count: number;
    lastSent: number;
    title: string;
    body: string;
    data: Record<string, any>;
    summaryMessage: string;
}

@Injectable()
export class NotificationsService {
    private notificationQueue: Record<string, NotificationQueue> = {};

    constructor() {
        const firebaseConfig: ServiceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        };

        admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig),
        });
    }

    async queueNotification(
        token: string,
        title: string,
        body: string,
        summaryMessage: string,
        data?: Record<string, any>
    ): Promise<void> {
        const now = Date.now();
        const interval = 60000; // 1 minuto en milisegundos

        // si no existe, inicializamos una instancia para el token
        if (!this.notificationQueue[token]) {
            this.notificationQueue[token] = {
                count: 0,
                lastSent: now,
                title,
                body,
                data: data || {},
                summaryMessage
            };
        }

        // validamos si es la primera notificación o si el intervalo ha pasado
        if (this.notificationQueue[token].count === 0) {
            try {
                await this.sendNotification(token, title, body, data);
                this.notificationQueue[token].lastSent = now;
            } catch (error) {
                console.error('Error en el service al enviar la notificación: ', error);
                throw error;
            }
        } else if ((now - this.notificationQueue[token].lastSent) > interval) {
            // si han pasado más de 5 minutos desde el último envío, envía el resumen
            await this.sendSummaryNotification(token);
            this.notificationQueue[token] = {
                count: 0,
                lastSent: now,
                title,
                body,
                data: data || {},
                summaryMessage
            }; // reiniciamos la instancia para el token actual
        }

        // incrementamos el contador de notificaciones
        this.notificationQueue[token].count++;
    }

    private async sendNotification(token: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
        const message = {
            notification: { title, body },
            data: data || {},
            token: token,
        };

        try {
            await admin.messaging().send(message);
            console.log(`Notificación enviada correctamente al token ${token}; "${body}"`);
        } catch (error) {
            console.error('Error al enviar la notificación:', error);
            throw error;
        }
    }

    private async sendSummaryNotification(token: string): Promise<void> {
        const { count, summaryMessage, data } = this.notificationQueue[token];

        // mensaje de resúmen
        const summaryBody = count === 1 ? this.notificationQueue[token].body : `Tienes ${count} notificaciones relacionadas a ${summaryMessage}.`;

        const message = {
            notification: { title: this.notificationQueue[token].title, body: summaryBody },
            data: data,
            token: token,
        };

        try {
            await admin.messaging().send(message);
            console.log(`Notificación enviada correctamente al token ${token}; "${summaryBody}".`);
        } catch (error) {
            console.error('Error al enviar la notificación, ', error);
            throw error;
        }
    }
}
