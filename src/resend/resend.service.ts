/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;
  private readonly logger = new Logger(ResendService.name);
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is missing in .env file');
    }

    this.resend = new Resend(apiKey);
  }

  async sendEmail(to: string, subject: string) {
    try {
      const response = await this.resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        //from: 'DevZone <rakib25059159@gmail.com>',
        to: [to],
        subject: subject,
        html: `<div>hello, this is a test email</div>`,
      });

      return { success: true, data: response };
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw error;
    }
  }
}
