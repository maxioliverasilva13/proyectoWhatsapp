import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { Device } from './device.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class DeviceService {
  private messaging: admin.messaging.Messaging;

  constructor(
    @InjectRepository(Device)
    private readonly dispositivoRepository: Repository<Device>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {
    const subdomain = process.env.SUBDOMAIN;
    if (subdomain === 'app') {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
      this.messaging = admin.messaging();
    }
  }

  async registrarDispositivo(
    userId: number,
    fcmToken: string,
  ): Promise<Device> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['dispositivos'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const existsFCM = await this.dispositivoRepository.findOne({
      where: { fcmToken: fcmToken },
    });
    if (!existsFCM) {
      const nuevoDispositivo = this.dispositivoRepository.create({
        fcmToken,
        usuario,
      });
      return this.dispositivoRepository.save(nuevoDispositivo);
    }
    return existsFCM;
  }

  async sendNotificationUser(userId: number, title: string, desc: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['dispositivos'],
    });

    console.log('usuario', usuario);
    if (!usuario || usuario.dispositivos?.length === 0) {
      throw new NotFoundException('User not device registered!');
    }

    await Promise.all(
      usuario?.dispositivos?.map(async (device) => {
        try {
          const message = {
            notification: { title: title, body: desc },
            token: device.fcmToken,
          };
          await admin.messaging().send(message);
        } catch (error) {
          throw new InternalServerErrorException(
            'Error sending notification',
            error.message,
          );
        }
      }),
    );
    return { success: true, message: 'Notification sended.' };
  }

  async sendNotificationEmpresa(
    empresaId: number,
    title: string,
    desc: string,
  ) {
    const usuarios = await this.usuarioRepository.find({
      where: { id_empresa: empresaId },
      relations: ['dispositivos'],
    });

    if (!usuarios || usuarios?.length === 0) {
      throw new NotFoundException('User not device registered!');
    }

    await Promise.all(
      usuarios?.map(async (usuario) => {
        await Promise.all(
          usuario?.dispositivos?.map(async (device) => {
            try {
              const message = {
                notification: { title: title, body: desc },
                token: device.fcmToken,
              };
              await admin.messaging().send(message);
            } catch (error) {
              throw new InternalServerErrorException(
                'Error sending notification',
                error.message,
              );
            }
          }),
        );
      }),
    );
    return { success: true, message: 'Notification sended.' };
  }
}
