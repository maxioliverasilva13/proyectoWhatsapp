// payments.controller.ts
import { Controller, Post, Body, Req, Request, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SubscriptionStatus } from './subscription-status.enum';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // // Endpoint para verificar una compra
  // @Post('verify-purchase')
  // async verifyPurchase(@Body() body: { userId: string; subscriptionId: string; purchaseToken: string }) {
  //   const { userId, subscriptionId, purchaseToken } = body;
  //   const result = await this.paymentsService.verifyPurchase(
  //     process.env.GOOGLE_PACKAGE_NAME,
  //     subscriptionId,
  //     purchaseToken,
  //   );

  //   const status = result.status === 'ACTIVE' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED;
  //   await this.paymentsService.updateSubscriptionStatus(userId, status);

  //   return { message: 'Purchase verified and status updated' };
  // }

  @Post('createInitial')
  async createInitial(@Body() body: any, @Request() req) {
    const userId = req?.user?.userId;
    await this.paymentsService.handleInitial({ ...body, userId: userId });
    return { success: true };
  }

  @Post('isPaymentOk')
  async isPaymentVerifiedOk(@Body() body: any) {
    console.log('isPaymentOk?:', JSON.stringify(body));
    const resp = await this.paymentsService.isPaymentOk(body);
    return resp;
  }

  @Post('cancel')
  async cancelPayment(@Body() body: any, @Request() req) {
    const userId = req?.user?.userId;
    console.log('cancelPayment?:', JSON.stringify(body));
    const resp = await this.paymentsService.cancelPayment(userId, body?.purchaseToken);
    return resp;
  }


  @Get('plans')
  async getPayments() {
    const resp = await this.paymentsService.getPlans();
    return resp;
  }

  @Post('verify')
  async handleWebhook(@Body() body: any) {
    const pubsubMessage = body.message;
    if (pubsubMessage) {
      const decodedData = JSON.parse(
        Buffer.from(pubsubMessage.data, 'base64').toString('utf-8')
      );

      await this.paymentsService.handleRtdn(decodedData);
      return { ok: true };
    }
  }
}
