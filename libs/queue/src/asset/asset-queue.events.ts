import { QueueEventsListener, QueueEventsHost, OnQueueEvent, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ASSET_QUEUE } from './asset.types';
import { PrismaService } from '@nestjs-monorepo-template/prisma';

@QueueEventsListener(ASSET_QUEUE)
export class AssetQueueEvents extends QueueEventsHost {
  private readonly logger = new Logger(AssetQueueEvents.name);

  constructor(
    @InjectQueue(ASSET_QUEUE) private readonly assetQueue: Queue,
    private readonly prisma: PrismaService
  ) {
    super();
  }

  @OnQueueEvent('failed')
  async onJobFailed(args: { jobId: string; failedReason: string }) {
    const { jobId, failedReason } = args;
    this.logger.error(`[Events] Asset optimization job ${jobId} failed permanently inside queue!`);

    try {
      const job = await this.assetQueue.getJob(jobId);
      if (!job || !job.data || !job.data.assetId) {
        this.logger.warn(`[Events] Could not resolve job data for jobId: ${jobId}`);
        return;
      }

      this.logger.log(`[Events] Marking asset ${job.data.assetId} as FAILED in database. Reason: ${failedReason}`);

      await this.prisma.asset.update({
        where: { id: job.data.assetId },
        data: {
          status: 'FAILED',
          error: failedReason || 'Unknown BullMQ job failure.',
        },
      });
    } catch (error: any) {
      this.logger.error(`[Events] Failed to update asset status on job failure: ${error.message}`);
    }
  }
}
