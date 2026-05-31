import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MAIL_QUEUE, WelcomeMailPayload } from './mail.types';

@Injectable()
export class MailQueueService {
  private readonly logger = new Logger(MailQueueService.name);

  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue
  ) {}

  async queueWelcomeEmail(payload: WelcomeMailPayload): Promise<void> {
    this.logger.log(`Queueing welcome email for: ${payload.email}`);
    await this.mailQueue.add('welcome', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 1000,
    });
  }
}
