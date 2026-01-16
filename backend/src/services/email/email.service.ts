import { EmailProvider, SendEmailOptions, EmailResult } from './email.interface.js';
import { ResendProvider } from './resend.provider.js';
import config from '../../config/index.js';

// Email templates
import { getInvitationEmailTemplate } from './templates/invitation.js';
import { getWelcomeEmailTemplate } from './templates/welcome.js';
import { getPasswordResetEmailTemplate } from './templates/password-reset.js';
import { getPasswordChangedEmailTemplate } from './templates/password-changed.js';

class EmailService {
  private provider: EmailProvider;

  constructor() {
    // Can swap providers here
    this.provider = new ResendProvider();
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    return this.provider.send(options);
  }

  async sendInvitation(
    email: string,
    organizationName: string,
    inviterName: string,
    acceptUrl: string,
    expiryHours: number = 72
  ): Promise<EmailResult> {
    const { subject, html, text } = getInvitationEmailTemplate({
      organizationName,
      inviterName,
      acceptUrl,
      expiryHours,
      appName: 'Multi-Tenant App', // TODO: Get from platform settings
    });

    return this.send({ to: email, subject, html, text });
  }

  async sendWelcome(
    email: string,
    firstName: string,
    verificationUrl?: string
  ): Promise<EmailResult> {
    const { subject, html, text } = getWelcomeEmailTemplate({
      firstName,
      verificationUrl,
      loginUrl: `${config.frontendUrl}/login`,
      appName: 'Multi-Tenant App',
      supportEmail: 'support@example.com',
    });

    return this.send({ to: email, subject, html, text });
  }

  async sendPasswordReset(
    email: string,
    firstName: string,
    resetUrl: string
  ): Promise<EmailResult> {
    const { subject, html, text } = getPasswordResetEmailTemplate({
      firstName,
      resetUrl,
      appName: 'Multi-Tenant App',
    });

    return this.send({ to: email, subject, html, text });
  }

  async sendPasswordChanged(
    email: string,
    firstName: string
  ): Promise<EmailResult> {
    const { subject, html, text } = getPasswordChangedEmailTemplate({
      firstName,
      appName: 'Multi-Tenant App',
      supportEmail: 'support@example.com',
    });

    return this.send({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
export default emailService;
