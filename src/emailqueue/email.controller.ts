import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailCOntroller {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  sendEmail(@Body() data: { message: string, email: string }) {
    return this.emailService.sendEmail(data.email, "ME", "welcome");
  }
}
