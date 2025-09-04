import { Controller, Post, Body } from '@nestjs/common';
import { EmailServiceResend } from './email.service';
import { CreateEmailDto } from './dto/create-email-dto';

@Controller('send-email')
export class EmailResendController {
  constructor(private readonly emailServiceResend: EmailServiceResend) {}

  @Post()
  async sendCustomEmail(@Body() emailData: CreateEmailDto) {
    const { from, to, subject, message, isHtml = false } = emailData;
    
    return this.emailServiceResend.sendCustomEmail(
      from,
      to, 
      subject,
      message,
      isHtml
    );
  }
}
