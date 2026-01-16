import { Resend } from 'resend';
import { EmailProvider, SendEmailOptions, EmailResult } from './email.interface.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

export class ResendProvider implements EmailProvider {
  private client: Resend;

  constructor() {
    this.client = new Resend(config.email.resendApiKey);
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    try {
      // In development without API key, just log
      if (!config.email.resendApiKey || config.email.resendApiKey === 're_xxxxxxxxxxxx') {
        logger.info('Email would be sent (dev mode):', {
          to: options.to,
          subject: options.subject,
        });
        return { success: true, messageId: 'dev-mode-' + Date.now() };
      }

      const result = await this.client.emails.send({
        from: options.from || config.email.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (result.error) {
        logger.error('Email send error:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Email send exception:', { error: message });
      return { success: false, error: message };
    }
  }
}
