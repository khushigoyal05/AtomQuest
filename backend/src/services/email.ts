import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const isMockMode = !process.env.SMTP_HOST || process.env.SMTP_HOST === '';

const transporter = isMockMode ? null : nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
  .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
  .body { padding: 32px; color: #374151; line-height: 1.6; }
  .footer { background: #f9fafb; padding: 20px 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
  .btn { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 16px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚛️ AtomQuest</h1>
      <p>Goal Setting & Tracking Portal</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">© 2026 AtomQuest. This is an automated notification.</div>
  </div>
</body>
</html>`;

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const fullHtml = emailTemplate(html);

  if (isMockMode) {
    console.log('\n📧 ─────── EMAIL (MOCK MODE) ───────');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content: ${html.replace(/<[^>]+>/g, '').trim().substring(0, 200)}`);
    console.log('─────────────────────────────────────\n');
    return { messageId: 'mock-' + Date.now() };
  }

  try {
    const info = await transporter!.sendMail({
      from: `"AtomQuest" <${process.env.EMAIL_FROM || 'noreply@atomquest.com'}>`,
      to,
      subject,
      html: fullHtml,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('❌ Email failed:', err);
  }
}
