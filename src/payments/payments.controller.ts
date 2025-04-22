// payments.controller.ts
import { Controller, Post, Body, Req, Request } from '@nestjs/common';
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
    console.log('createInitial - ', body);
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

  @Post('verify')
  async handleWebhook(@Body() body: any) {
    console.log('PAGO - RTDN recibido:', body);
    await this.paymentsService.handleRtdn(body);
    return { ok: true };
  }
}
