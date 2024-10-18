import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async sendNotification(
    @Body('token') token: string,
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('summaryMessage') summaryMessage: string,
    @Body('data') data?: Record<string, any>,
  ) {
    try {
      await this.notificationsService.queueNotification(token, title, body, summaryMessage, data);
      return { message: 'Notificación encolada coprrectamente' };
    } catch (error) {
      console.error('Error al encolar notificación: ', error);
      return { message: 'Fallo al encolar notificación, ', error: error.message };
    }
  }
}
