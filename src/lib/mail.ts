import nodemailer from "nodemailer";

export function mailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerifyCodeMail(
  to: string,
  code: string
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `${code} 是你的 BuildHub 验证码`,
    text: `${code}\n\n10 分钟内有效。如果不是你本人操作，请忽略这封邮件。`,
    html: `<div style="font-family:-apple-system,sans-serif;padding:24px;color:#1a1a1a">
      <p>你的 BuildHub 验证码：</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
      <p style="color:#888;font-size:13px">10 分钟内有效。如果不是你本人操作，请忽略这封邮件。</p>
    </div>`,
  });
}
