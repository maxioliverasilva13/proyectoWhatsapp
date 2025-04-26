// payments.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
    empresaId?: string;
    purcheaseToken: string;
    sku: string;
    newPurcheaseToken?: string;
    userId?: string;
  }) {
    let existingPayment = await this.paymentRepo.findOne({
      where: {
        purchaseToken: data?.purcheaseToken ?? '',
      },
    });

    if (existingPayment?.id) {
      console.log('actualizando pago con empresa id', data?.empresaId, existingPayment);
      console.log("existingPayment", existingPayment)
      existingPayment.active = false;
      existingPayment.started_by_user_id = data?.userId;

      if (data?.empresaId) {
        const empresa = await this.empresaRepo.findOne({
          where: { id: Number(data.empresaId) },
        });
        console.log("sip, empresa es", empresa)
        if (empresa?.id) {
        console.log("xd2", empresa)
          existingPayment.empresa = empresa;
        }
      }

      await this.paymentRepo.update(existingPayment?.id, existingPayment);
      return existingPayment;
    } else {
      console.log('creando nuevo pago con empresa id', data?.empresaId);

      const newPayment = this.paymentRepo.create({
        purchaseToken: data.purcheaseToken,
        subscription_sku: data.sku,
        active: false,
      });
      newPayment.started_by_user_id = data?.userId;

      if (data?.empresaId) {
        const empresa = await this.empresaRepo.findOne({
          where: { id: Number(data.empresaId) },
        });
        if (empresa?.id) {
          newPayment.empresa = empresa;
        }
      }

      return await this.paymentRepo.save(newPayment);
    }
  }

  async handleRtdn(rtdnData: any) {
    const packageName = rtdnData?.packageName;
    const purchaseToken = rtdnData?.subscriptionNotification?.purchaseToken;
    const subscriptionId = rtdnData?.subscriptionNotification?.subscriptionId;
    const notificationType =
      rtdnData?.subscriptionNotification?.notificationType;

    if (!packageName || !purchaseToken || !subscriptionId) {
      throw new BadRequestException('Invalid params');
    }
    console.log('PAGO - RTDN recibido:', rtdnData);


    const purchase = await this.verifyPurchase(
      packageName,
      subscriptionId,
      purchaseToken,
    );

    const linkedPurchaseToken = purchase?.linkedPurchaseToken;

    let payment = await this.paymentRepo.findOne({
      where: {
        purchaseToken: In([purchaseToken, linkedPurchaseToken]),
      },
      relations: ['empresa'],
    });

    if (!payment) {
      payment = await this.handleInitial({
        purcheaseToken: purchaseToken,
        sku: subscriptionId,
        newPurcheaseToken: purchaseToken,
      });
      console.log('Pago no encontrado, creando uno nuevo');
    }

    const empresa = await this.empresaRepo.findOne({
      where: { id: payment.empresa?.id },
      relations: ['payment'],
    });

    if (!empresa) {
      console.log('Empresa no encontrada para RTDN');
      return { success: false };
    }

    payment.package = packageName;

    const now = new Date();

    switch (notificationType) {
      case 1: // SUBSCRIPTION_RECOVERED
      case 2: // SUBSCRIPTION_RENEWED
      case 4: // SUBSCRIPTION_PURCHASED
      case 7: // SUBSCRIPTION_RESTARTED
        payment.active = true;
        payment.subscription_date = new Date(
          Number(purchase?.expiryTimeMillis ?? now.getTime()),
        ).toISOString();
        console.log('Suscripción activa y actualizada');
        break;

      case 3: // SUBSCRIPTION_CANCELED
      case 5: // SUBSCRIPTION_ON_HOLD
      case 6: // SUBSCRIPTION_IN_GRACE_PERIOD
      case 10: // SUBSCRIPTION_PAUSED
      case 12: // SUBSCRIPTION_REVOKED
      case 13: // SUBSCRIPTION_EXPIRED
        payment.active = false;
        payment.subscription_date = now.toISOString();
        console.log(
          'Suscripción desactivada (cancelada, en pausa, expirada o revocada)',
        );
        break;

      default:
        console.log(
          'Notificación no manejada explícitamente:',
          notificationType,
        );
        return;
    }

    await this.paymentRepo.save(payment);

    if (payment.active) {
      empresa.deploy = true;
      empresa.payment = payment;
      await this.empresaRepo.save(empresa);
      console.log('Empresa activada');
    } else {
      console.log("Emrpesa desactivada")
    }

    console.log('Proceso de RTDN completado');
    return { success: true };
  }
}
