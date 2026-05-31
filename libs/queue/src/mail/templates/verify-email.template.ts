import { getBaseMailLayout } from './layout';

export interface VerifyEmailOptions {
  name: string;
  verifyUrl: string;
}

export const getVerifyEmailTemplate = (options: VerifyEmailOptions): string => {
  const content = `
    <h2 style="margin-top: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Verify your email address ✉️</h2>
    <p>Hi ${options.name},</p>
    <p>Thank you for signing up! To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="${options.verifyUrl}" class="button" target="_blank">Verify Email Address</a>
    </div>
    <p style="margin-top: 24px;">This verification link will expire in 24 hours.</p>
    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser: <br>
    <a href="${options.verifyUrl}" style="color: #2563eb; text-decoration: underline;">${options.verifyUrl}</a></p>
  `;

  return getBaseMailLayout({
    title: 'Verify Your Email Address',
    preheader: `Verify your email to get started, ${options.name}!`,
    content,
  });
};
