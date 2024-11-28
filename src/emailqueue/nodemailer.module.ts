import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: 'whatsproy@gmail.com',
      },
      template: {
        dir: join(__dirname, '../templates'),
        adapter: new HandlebarsAdapter(undefined, { inlineCssEnabled: false }),
        options: {
          strict: true,
        },
      },
    }),
  ],
  exports: [MailerModule],
})
export class EmailModule {}
