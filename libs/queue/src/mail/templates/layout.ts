export interface MailLayoutOptions {
  title: string;
  preheader?: string;
  content: string;
}

export const getBaseMailLayout = (options: MailLayoutOptions): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .body {
      padding: 40px 32px;
      line-height: 1.6;
      font-size: 16px;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0f172a;
      color: #ffffff !important;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      border-radius: 8px;
      margin-top: 24px;
      box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2);
    }
    .button:hover {
      background-color: #1e293b;
    }
    .preheader {
      display: none;
      max-height: 0px;
      overflow: hidden;
      mso-hide: all;
    }
  </style>
</head>
<body>
  ${options.preheader ? `<span class="preheader">${options.preheader}</span>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">NESTJS MONOREPO TEMPLATE</div>
      </div>
      <div class="body">
        ${options.content}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} NestJS Monorepo Template. All rights reserved.</p>
        <p>If you have any questions, feel free to reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};
