// payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Payment } from './payment.entity';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class PaymentsService {
  private auth;
  private androidPublisher;

  constructor(
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) {
    if (process.env.SUBDOMAIN === 'app') {
      const keyfileJson = process.env.GOOGLE_PRIVATE_KEY;

      if (!keyfileJson) {
        throw new Error('GOOGLE_PRIVATE_KEY no está definido');
      }

      const tempPath = path.join(os.tmpdir(), 'google-service-account.json');
      fs.writeFileSync(tempPath, keyfileJson);
      console.log('Formatted Keyfile:', keyfileJson);
      this.auth = new google.auth.GoogleAuth({
        keyFile: tempPath,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: this.auth,
      });
    }
  }

  async isPaymentOk(data: { empresaId: string; purcheaseToken: string }) {
    try {
      const empresa = await this.empresaRepo.findOne({
        where: { id: Number(data.empresaId) },
      });
      if (!empresa) {
        return { success: false };
      }
      const payment = await this.paymentRepo.findOne({
        where: { purchaseToken: data.purcheaseToken, empresa: empresa },
      });
      if (!payment || payment?.active === false) {
        return { success: false };
      }
      return { success: true };
    } catch (error) {
      console.error('Error verificando compra:', error?.errors ?? error);
      throw new Error('Error verificando compra');
    }
  }

  async verifyPurchase(
    packageName: string,
    subscriptionId: string,
    purchaseToken: string,
  ) {
    try {
      const res = await this.androidPublisher.purchases.subscriptions.get({
        packageName,
        subscriptionId,
        token: purchaseToken,
      });

      return res.data;
    } catch (error) {
      console.error('Error verificando compra:', error?.errors ?? error);
      throw new Error('Error verificando compra');
    }
  }

  async handleInitial(data: {
    empresaId: string;
    purcheaseToken: string;
    sku: string;
    userId: string;
  }) {
    const empresa = await this.empresaRepo.findOne({
      where: { id: Number(data.empresaId) },
    });
    if (!empresa?.id) {
      throw new BadRequestException('Datos no válidos');
    }

    let existingPayment = await this.paymentRepo.findOne({
      where: {
        empresa: { id: Number(data.empresaId) },
        subscription_sku: data.sku,
        started_by_user_id: data.userId,
      },
    });

    if (existingPayment) {
      existingPayment.purchaseToken = data.purcheaseToken;
      existingPayment.active = false;
      await this.paymentRepo.save(existingPayment);
    } else {
      const newPayment = this.paymentRepo.create({
        purchaseToken: data.purcheaseToken,
        subscription_sku: data.sku,
        started_by_user_id: data.userId,
        active: false,
        empresa,
      });
      await this.paymentRepo.save(newPayment);
    }
  }

  async handleRtdn(rtdnData: any) {
    const packageName = rtdnData?.packageName;
    const purchaseToken = rtdnData?.subscriptionNotification?.purchaseToken;
    const subscriptionId = rtdnData?.subscriptionNotification?.subscriptionId;

    if (!packageName || !purchaseToken || !subscriptionId) {
      throw new BadRequestException('Invalid params');
    }

    const purchase = await this.verifyPurchase(
      packageName,
      subscriptionId,
      purchaseToken,
    );

    console.log('Si recibo', purchase);

    let payment = await this.paymentRepo.findOne({
      where: { purchaseToken },
      relations: ['empresa'],
    });

    if (!payment) {
      console.log('Pago no encontrado para el token');
      return;
    }

    const empresa = await this.empresaRepo.findOne({
      where: { id: payment.empresa?.id },
      relations: ['payment'],
    });

    if (!empresa) {
      console.log('Empresa no encontrada para RTDN');
      return;
    }
    payment.package = packageName;

    if (purchase?.paymentState === 1 || purchase?.paymentState === 2) {
      payment.active = true;

      const currentDate = new Date();
      let expirationDate: Date;

      expirationDate = new Date(
        currentDate.setMonth(currentDate.getMonth() + 1),
      );

      payment.subscription_date = expirationDate.toISOString();

      console.log(
        'Pago validado, suscripción activa y fecha de expiración actualizada',
      );
    } else {
      payment.active = false;
      payment.subscription_date = new Date().toISOString();
      console.log('Pago inválido, suscripción desactivada');
    }

    await this.paymentRepo.save(payment);

    if (payment.active) {
      empresa.deploy = true;
      empresa.payment = payment;
      await this.empresaRepo.save(empresa);
      console.log('Empresa activada');
    }

    console.log('Proceso de RTDN completado');
  }
}
