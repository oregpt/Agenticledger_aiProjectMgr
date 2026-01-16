interface PasswordResetTemplateData {
  firstName: string;
  resetUrl: string;
  appName: string;
}

export const getPasswordResetEmailTemplate = (data: PasswordResetTemplateData) => {
  const subject = `Reset your ${data.appName} password`;

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
    .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>

    <p>Hi ${data.firstName},</p>

    <p>We received a request to reset your password. Click the button below to set a new password:</p>

    <p style="margin: 30px 0;">
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>

    <div class="warning">
      <strong>This link will expire in 1 hour.</strong>
    </div>

    <div class="footer">
      <p>If you didn't request this, you can ignore this email. Your password won't be changed.</p>
      <p>Best regards,<br>The ${data.appName} Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Reset your ${data.appName} password

Hi ${data.firstName},

We received a request to reset your password. Click the link below to set a new password:
${data.resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can ignore this email. Your password won't be changed.

Best regards,
The ${data.appName} Team
  `.trim();

  return { subject, html, text };
};
