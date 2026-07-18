import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  async sendResetEmail(to: string, resetLink: string) {
    await this.transporter.sendMail({
      from: `"Library" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Password Reset Request',
      html: `
        <h3>Password Reset</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 30 minutes.</p>
      `,
    });
  }
}
