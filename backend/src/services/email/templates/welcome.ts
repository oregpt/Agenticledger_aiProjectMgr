interface WelcomeTemplateData {
  firstName: string;
  verificationUrl?: string;
  loginUrl: string;
  appName: string;
  supportEmail: string;
}

export const getWelcomeEmailTemplate = (data: WelcomeTemplateData) => {
  const subject = `Welcome to ${data.appName}!`;

  const verificationSection = data.verificationUrl
    ? `
    <p>Please verify your email by clicking the button below:</p>

    <p style="margin: 30px 0;">
      <a href="${data.verificationUrl}" class="button">Verify Email</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
    `
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to ${data.appName}!</h1>

    <p>Hi ${data.firstName},</p>

    <p>Your account has been created successfully. We're excited to have you on board!</p>

    ${verificationSection}

    <p>Get started by logging in at:</p>
    <p><a href="${data.loginUrl}">${data.loginUrl}</a></p>

    <div class="footer">
      <p>If you have any questions, contact us at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>
      <p>Best regards,<br>The ${data.appName} Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const verificationText = data.verificationUrl
    ? `
Please verify your email by clicking the link below:
${data.verificationUrl}

`
    : '';

  const text = `
Welcome to ${data.appName}!

Hi ${data.firstName},

Your account has been created successfully.

${verificationText}Get started by logging in at:
${data.loginUrl}

If you have any questions, contact us at ${data.supportEmail}.

Best regards,
The ${data.appName} Team
  `.trim();

  return { subject, html, text };
};
