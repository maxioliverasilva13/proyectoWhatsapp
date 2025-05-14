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
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as moment from 'moment';
import { PlanEmpresa } from 'src/planEmpresa/entities/planEmpresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';

@Injectable()
export class PaymentsService {
  private auth;
  private androidPublisher;

  constructor(
    @InjectRepository(Empresa) private empresaRepo: Repository<Empresa>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Usuario) private userRepo: Repository<Usuario>,
    @InjectRepository(Plan) private planRepo: Repository<Plan>,
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

  async getPlans() {
    const payments = await this.planRepo.find({ where: { active: true } });
    return payments;
  }

  async cancelPayment(userId: any, purchaseToken: string) {
    try {
      const loggedUser = await this.userRepo.find({
        where: { id: userId, firstUser: true },
      });
      if (!loggedUser) {
        return { success: false, onlyAdmin: true };
      }
      const payment = await this.paymentRepo.findOne({
        where: { purchaseToken: purchaseToken },
        relations: ['empresa'],
      });

      if (!payment || !payment?.empresa) {
        return { success: false };
      }
      const now = new Date();
      payment.active = false;
      payment.isCancelled = true;
      payment.subscription_date = moment(now).add(3, 'days').toISOString();
      await this.paymentRepo.save(payment);
      return { success: true };
    } catch (error) {
      console.error('Error verificando compra:', error?.errors ?? error);
      throw new Error('Error verificando compra');
    }
  }

  async isPaymentOk(data: { empresaId: string; purcheaseToken: string }) {
    try {
      const empresa = await this.empresaRepo.findOne({
        where: { id: Number(data.empresaId) },
        relations: ['payment'],
      });
      if (!empresa) {
        console.log('no empresa');
        return { success: false };
      }
      if (
        !empresa?.payment ||
        (empresa?.payment && empresa?.payment?.active === false)
      ) {
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

    const planEmpresa = await this.planRepo.findOne({
      where: { product_sku: data?.sku },
    });

    if (!planEmpresa) {
      return;
    }

    if (existingPayment?.id) {
      existingPayment.active = false;
      existingPayment.started_by_user_id = data?.userId;
      existingPayment.plan = planEmpresa;
      existingPayment.purchaseToken = data.purcheaseToken;
      if (data?.empresaId) {
        const empresa = await this.empresaRepo.findOne({
          where: { id: Number(data.empresaId) },
        });
        console.log('sip, empresa es', empresa);
        if (empresa?.id) {
          console.log('xd2', empresa);
          empresa.payment = existingPayment;
          await this.empresaRepo.save(empresa);
        }
      }

      await this.paymentRepo.save(existingPayment);
      return existingPayment;
    } else {
      console.log('creando nuevo pago con empresa id', data?.empresaId);

      const newPayment: any = {
        purchaseToken: data.purcheaseToken,
        subscription_sku: data.sku,
        active: false,
        plan: planEmpresa,
      };
      newPayment.started_by_user_id = data?.userId;

      if (data?.empresaId) {
        const empresa = await this.empresaRepo.findOne({
          where: { id: Number(data.empresaId) },
        });
        if (empresa?.id) {
          newPayment.empresa = empresa;
        }
      }

      console.log("nono, es aca")
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
        payment.isCancelled = false;
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
        payment.isCancelled = true;
        payment.subscription_date = moment(now).add(3, 'days').toISOString();
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
      console.log('Emrpesa desactivada');
    }

    console.log('Proceso de RTDN completado');
    return { success: true };
  }
}
