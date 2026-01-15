import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { EmailMessage } from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(message: EmailMessage): Promise<void> {
    const transport = this.getTransport();
    if (!transport) {
      this.logger.warn('SMTP transport not configured; skipping email send.');
      return;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (!from) {
      this.logger.warn('SMTP_FROM not configured; skipping email send.');
      return;
    }

    await transport.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }

  private getTransport() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) return null;

    const secure = String(process.env.SMTP_SECURE ?? 'false') === 'true';
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
}
