import { getBaseMailLayout } from './layout';

export interface WelcomeMailOptions {
  name: string;
  loginUrl: string;
}

export const getWelcomeMailTemplate = (options: WelcomeMailOptions): string => {
  const content = `
    <h2 style="margin-top: 0; font-size: 22px; font-weight: 700; color: #0f172a;">Welcome to the template, ${options.name}! 👋</h2>
    <p>We are absolutely thrilled to have you here. You have successfully initialized your account on the <strong>NestJS Monorepo Template</strong>.</p>
    <p>This repository provides a production-ready template that includes authentication, global guards, structured modules, background workers using BullMQ, and Redis caching natively integrated.</p>
    <p>To get started and explore your user dashboard, click the button below:</p>
    <div style="text-align: center;">
      <a href="${options.loginUrl}" class="button" target="_blank">Access Your Dashboard</a>
    </div>
    <p style="margin-top: 32px; font-size: 14px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser: <br>
    <a href="${options.loginUrl}" style="color: #2563eb; text-decoration: underline;">${options.loginUrl}</a></p>
  `;

  return getBaseMailLayout({
    title: 'Welcome to NestJS Monorepo Template!',
    preheader: `We're thrilled to have you here, ${options.name}!`,
    content,
  });
};
