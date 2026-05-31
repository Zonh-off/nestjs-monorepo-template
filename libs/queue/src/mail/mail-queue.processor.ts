import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MAIL_QUEUE, WelcomeMailPayload } from './mail.types';
import { getWelcomeMailTemplate } from './templates/welcome.template';

@Processor(MAIL_QUEUE)
export class MailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(MailQueueProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);
    
    switch (job.name) {
      case 'welcome': {
        const data = job.data as WelcomeMailPayload;
        await this.handleWelcomeMail(data);
        break;
      }
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        break;
    }
  }

  private async handleWelcomeMail(data: WelcomeMailPayload): Promise<void> {
    this.logger.log(`[Worker] Compiling HTML welcome email template for ${data.name}...`);
    
    const html = getWelcomeMailTemplate({
      name: data.name,
      loginUrl: 'http://localhost:4000/login',
    });

    this.logger.log(`[Worker] Sending welcome email to ${data.email} via SMTP...`);
    // Mock SMTP network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.logger.log(`[Worker] Welcome email successfully sent to ${data.email}! HTML Length: ${html.length} characters.`);
  }
}
