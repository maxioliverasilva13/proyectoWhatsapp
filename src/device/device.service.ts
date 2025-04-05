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
      relations: ['dispositivo'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.dispositivo) {
      usuario.dispositivo.fcmToken = fcmToken;
      return this.dispositivoRepository.save(usuario.dispositivo);
    }

    const nuevoDispositivo = this.dispositivoRepository.create({
      fcmToken,
      usuario,
    });
    usuario.dispositivo = nuevoDispositivo;
    this.usuarioRepository.save(usuario);
    return this.dispositivoRepository.save(nuevoDispositivo);
  }

  async sendNotificationUser(userId: number, title: string, desc: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['dispositivo'],
    });

    console.log('usuario', usuario);
    if (!usuario || !usuario.dispositivo || !usuario.dispositivo.fcmToken) {
      throw new NotFoundException('User not device registered!');
    }

    const message = {
      notification: { title: title, body: desc },
      token: usuario.dispositivo.fcmToken,
    };

    try {
      await admin.messaging().send(message);
      return { success: true, message: 'Notification sended.' };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error sending notification',
        error.message,
      );
    }
  }
}
