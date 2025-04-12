import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('green-api-response-message')
export class GreenApiRetirveMessage {
  @Process('send')
  async handleSendMessage(job: Job) {
    console.log("llego aca")
    const { message, chatId } = job.data;

    const payload = {
      chatId,
      message: message?.message,
    };
    console.log(payload)

    console.log(process.env.ID_INSTANCE, process.env.API_TOKEN_INSTANCE)
    try {
      const resp = await fetch(
        `https://api.greenapi.com/waInstance${process.env.ID_INSTANCE}/sendMessage/${process.env.API_TOKEN_INSTANCE}`,
        {
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          body: JSON.stringify(payload),
        },
      );

      const respF = await resp.json();
      console.log("respF", respF)
      return { success: true };
    } catch (error: any) {
      console.log("aca error")
      console.log(error?.response?.data?.message ?? error);
      return { success: false }
    }
  }
}
