import { getBaseMailLayout } from './layout';

export interface ResetPasswordMailOptions {
  name: string;
  resetUrl: string;
}

export const getResetPasswordMailTemplate = (options: ResetPasswordMailOptions): string => {
  const content = `
    <h2 style="margin-top: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Reset your password 🔒</h2>
    <p>Hi ${options.name},</p>
    <p>We received a request to reset the password associated with your account. If you made this request, please click the button below to set a new password:</p>
    <div style="text-align: center;">
      <a href="${options.resetUrl}" class="button" target="_blank">Reset Password</a>
    </div>
    <p style="margin-top: 24px; font-weight: 500; color: #dc2626;">If you did not request a password reset, you can safely ignore this email. Your password will remain completely secure.</p>
    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser: <br>
    <a href="${options.resetUrl}" style="color: #2563eb; text-decoration: underline;">${options.resetUrl}</a></p>
  `;

  return getBaseMailLayout({
    title: 'Reset Your Password',
    preheader: `Click to reset your password, ${options.name}.`,
    content,
  });
};
