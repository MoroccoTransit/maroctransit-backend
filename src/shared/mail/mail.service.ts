// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;
    const logoUrl = this.configService.get('LOGO_URL');

    await this.transporter.sendMail({
      from: '"Transit Morocco" <noreply@transit.com>',
      to: email,
      subject: 'Password Reset Request',
      html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto;">
      <tr>
        <td style="padding: 30px 20px; background-color: #ffffff; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="${logoUrl}" alt="Transit Morocco Logo" width="180" style="max-width: 100%; height: auto;">
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #2d3748; margin: 0 0 25px 0;">Password Reset Request</h2>
          <p style="color: #4a5568; margin: 0 0 20px 0; line-height: 1.6;">We received a request to reset your Transit Morocco account password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3182ce; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #4a5568; margin: 20px 0; line-height: 1.6; font-size: 14px;">
            <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 25px 20px; background-color: #f7fafc; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #718096; margin: 0; font-size: 12px; line-height: 1.5;">
            Need help? Contact our support team at <a href="mailto:support@transit.com" style="color: #3182ce; text-decoration: none;">support@transit.com</a>
          </p>
          <p style="color: #a0aec0; margin: 15px 0 0 0; font-size: 12px;">
            © ${new Date().getFullYear()} Transit Morocco. All rights reserved.<br>
            Casablanca Logistics Park, Route d'El Jadida, Casablanca
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    });
  }
}
