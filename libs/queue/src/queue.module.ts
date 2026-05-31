import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { env } from '@nestjs-monorepo-template/common';
import { MAIL_QUEUE } from './mail/mail.types';
import { ASSET_QUEUE } from './asset/asset.types';
import { MailQueueService } from './mail/mail-queue.service';
import { AssetQueueService } from './asset/asset-queue.service';
import { MailQueueProcessor } from './mail/mail-queue.processor';
import { AssetQueueProcessor } from './asset/asset-queue.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD || undefined,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: MAIL_QUEUE },
      { name: ASSET_QUEUE }
    ),
  ],
  providers: [
    MailQueueService,
    MailQueueProcessor,
    AssetQueueService,
    AssetQueueProcessor,
  ],
  exports: [BullModule, MailQueueService, AssetQueueService],
})
export class QueueModule { }
