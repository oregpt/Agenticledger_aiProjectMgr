interface PasswordChangedTemplateData {
  firstName: string;
  appName: string;
  supportEmail: string;
}

export const getPasswordChangedEmailTemplate = (data: PasswordChangedTemplateData) => {
  const subject = `Your ${data.appName} password has been changed`;

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
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    .warning { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 12px; border-radius: 6px; margin: 20px 0; color: #721c24; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Changed</h1>

    <p>Hi ${data.firstName},</p>

    <p>Your password has been successfully changed.</p>

    <div class="warning">
      <strong>If you didn't make this change, please contact support immediately at <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</strong>
    </div>

    <div class="footer">
      <p>Best regards,<br>The ${data.appName} Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Your ${data.appName} password has been changed

Hi ${data.firstName},

Your password has been successfully changed.

If you didn't make this change, please contact support immediately at ${data.supportEmail}.

Best regards,
The ${data.appName} Team
  `.trim();

  return { subject, html, text };
};
