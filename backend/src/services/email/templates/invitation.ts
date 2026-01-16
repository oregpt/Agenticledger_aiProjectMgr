interface InvitationTemplateData {
  organizationName: string;
  inviterName: string;
  acceptUrl: string;
  expiryHours: number;
  appName: string;
}

export const getInvitationEmailTemplate = (data: InvitationTemplateData) => {
  const subject = `You've been invited to join ${data.organizationName}`;

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
    <h1>You're Invited!</h1>

    <p>Hi,</p>

    <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on ${data.appName}.</p>

    <p>Click the button below to accept the invitation and set up your account:</p>

    <p style="margin: 30px 0;">
      <a href="${data.acceptUrl}" class="button">Accept Invitation</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${data.acceptUrl}</p>

    <p><strong>This invitation will expire in ${data.expiryHours} hours.</strong></p>

    <div class="footer">
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p>Best regards,<br>The ${data.appName} Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
You've been invited to join ${data.organizationName}

Hi,

${data.inviterName} has invited you to join ${data.organizationName} on ${data.appName}.

Click the link below to accept the invitation:
${data.acceptUrl}

This invitation will expire in ${data.expiryHours} hours.

If you didn't expect this invitation, you can ignore this email.

Best regards,
The ${data.appName} Team
  `.trim();

  return { subject, html, text };
};
