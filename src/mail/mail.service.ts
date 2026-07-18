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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <!-- Header/Logo Area -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Library Management System</h2>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 24px;" />
          
          <!-- Content -->
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 12px; font-size: 18px; font-weight: 600;">Reset Your Password</h3>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            We received a request to reset the password for your account. Click the button below to set up a new password.
          </p>
          
          <!-- Button Area -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
              Reset Password
            </a>
          </div>
          
          <!-- Expiration Warning -->
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-bottom: 24px; border-radius: 0 8px 8px 0;">
            <p style="color: #991b1b; font-size: 13px; margin: 0; font-weight: 500;">
              Note: This link will expire in 30 minutes.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px 0;">
            If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 16px;" />
          
          <!-- Footer -->
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Library App. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendOtp(to: string, otp: string) {
    await this.transporter.sendMail({
      from: `"Library" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'OTP Verification Code',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <!-- Header/Logo Area -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Library Management System</h2>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 24px;" />
          
          <!-- Content -->
          <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 12px; font-size: 18px; font-weight: 600;">Email Verification</h3>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for registering. Please use the following One-Time Password (OTP) to complete your verification process. This code is valid for a limited time.
          </p>
          
          <!-- OTP Box -->
          <div style="background-color: #f9fafb; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e1b4b; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="color: #ef4444; font-size: 13px; margin: 0 0 24px 0; font-style: italic;">
            If you did not request this code, please ignore this email safely.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #f0f0f0; margin-bottom: 16px;" />
          
          <!-- Footer -->
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Library App. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
  }
}
