import { Resend } from 'resend';
import type { EmailService } from './types';

export interface ResendEmailServiceOptions {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  resendClient?: Resend;
}

export class ResendEmailService implements EmailService {
  private readonly fromEmail: string;
  private readonly toEmail: string;
  private readonly resend: Resend;

  constructor(options: ResendEmailServiceOptions) {
    this.fromEmail = options.fromEmail;
    this.toEmail = options.toEmail;
    this.resend = options.resendClient ?? new Resend(options.apiKey);
  }

  async send(subject: string, body: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: this.toEmail,
      subject,
      text: body,
    });

    if (error) {
      throw new Error(`Error al enviar email con Resend: ${error.message}`);
    }
  }
}

export class MockEmailService implements EmailService {
  readonly sentEmails: Array<{ subject: string; body: string }> = [];

  async send(subject: string, body: string): Promise<void> {
    this.sentEmails.push({ subject, body });
  }
}
